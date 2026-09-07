import { _electron as electron, expect, test as base } from "@playwright/test";
import type { ElectronApplication, Page, Request, TestInfo } from "@playwright/test";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { API_BASE_URL, PublicApi, type ApiLogEntry } from "../helpers/api";
import { seedBillingData, type BillingSeed } from "./test-data";

const require = createRequire(__filename);
const electronExecutable = require("electron") as string;
const desktopRoot = path.resolve(__dirname, "../..");
const mainEntry = path.join(desktopRoot, "out", "main", "index.js");
const rendererEntry = path.join(desktopRoot, "out", "renderer", "index.html");
const hideWindowsPreload = path.join(desktopRoot, "e2e", "fixtures", "hide-electron-windows.js");
const SERVER_WAIT_MS = 20_000;
const PORT_RELEASE_WAIT_MS = 10_000;
const DEFAULT_VIEWPORT = { width: 1280, height: 650 } as const;

export type RelayApp = {
  readonly page: Page;
  readonly api: PublicApi;
  readonly seed: BillingSeed;
  readonly dataRoot: string;
  readonly userDataPath: string;
  readonly databasePath: string;
  restart(): Promise<Page>;
  close(): Promise<void>;
  relaunch(): Promise<Page>;
  resize(width: number, height: number): Promise<void>;
};

type BillingFixtures = {
  app: RelayApp;
};

type HarnessState = {
  electronApp: ElectronApplication | null;
  page: Page | null;
  launchNumber: number;
  tracePaths: string[];
  activeTracePath: string | null;
  intentionalClose: boolean;
};

export const test = base.extend<BillingFixtures>({
  // Playwright requires an object-destructuring first parameter for fixtures.
  // eslint-disable-next-line no-empty-pattern
  app: async ({}, fixtureUse, testInfo) => {
    await assertBuiltApplication();
    await assertDevelopmentPortIsFree();

    const testRunId = crypto.randomUUID();
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "relay-billing-e2e-"));
    const appDataRoot = path.join(tempRoot, "app-data");
    await fs.mkdir(appDataRoot, { recursive: true });

    const mainLog: string[] = [];
    const rendererConsole: string[] = [];
    const rendererErrors: string[] = [];
    const apiLog: ApiLogEntry[] = [];
    const api = new PublicApi(API_BASE_URL, apiLog);
    const state: HarnessState = {
      electronApp: null,
      page: null,
      launchNumber: 0,
      tracePaths: [],
      activeTracePath: null,
      intentionalClose: false
    };
    let seed!: BillingSeed;
    let actualUserDataPath = "";
    const launch = async (): Promise<Page> => {
      if (state.electronApp) throw new Error("Relay Electron is already running.");
      state.intentionalClose = false;
      await waitForServerState(false, PORT_RELEASE_WAIT_MS);

      state.launchNumber += 1;
      const env = Object.fromEntries(
        Object.entries({
          ...process.env,
          MODE: "development",
          NODE_ENV: "test",
          ELECTRON_DISABLE_SANDBOX: "1",
          TZ: "Asia/Kolkata",
          LANG: "en_IN.UTF-8",
          ...(process.platform === "win32"
            ? { APPDATA: appDataRoot }
            : { XDG_CONFIG_HOME: appDataRoot })
        }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      );
      // T3 Code itself runs Electron as Node; the tested app must launch as Electron.
      delete env.ELECTRON_RUN_AS_NODE;
      // Keep real Electron windows fully rendered but never map them to the operator's desktop.
      env.NODE_OPTIONS = [env.NODE_OPTIONS, `--require=${hideWindowsPreload}`]
        .filter(Boolean)
        .join(" ");

      const electronApp = await electron.launch({
        executablePath: electronExecutable,
        args: [mainEntry, "--no-sandbox", "--lang=en-IN"],
        cwd: desktopRoot,
        env
      });
      state.electronApp = electronApp;
      attachMainProcessLogs(electronApp, mainLog);
      electronApp.once("close", () => {
        if (!state.intentionalClose && state.electronApp === electronApp) {
          mainLog.push("[harness] Electron closed unexpectedly during the journey.");
        }
        if (state.electronApp === electronApp) {
          state.electronApp = null;
          state.page = null;
        }
      });

      await waitForServerState(true, SERVER_WAIT_MS);
      const page = await waitForMainWindow(electronApp);
      state.page = page;
      attachRendererLogs(page, rendererConsole, rendererErrors, apiLog);

      actualUserDataPath = await electronApp.evaluate(({ app }) => app.getPath("userData"));
      assertIsolatedUserData(actualUserDataPath, appDataRoot);

      await resizeElectronContent(electronApp, page, DEFAULT_VIEWPORT);
      const hasVisibleNativeWindow = await electronApp.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows().some((candidate) => candidate.isVisible())
      );
      if (hasVisibleNativeWindow) {
        throw new Error("Billing E2E must not map an Electron window to the operator's desktop.");
      }

      return page;
    };

    const startTrace = async (): Promise<void> => {
      if (!state.electronApp) throw new Error("Relay Electron is not running.");
      const tracePath = path.join(tempRoot, `trace-launch-${state.launchNumber}.zip`);
      await state.electronApp.context().tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });
      state.tracePaths.push(tracePath);
      state.activeTracePath = tracePath;
    };

    const close = async (): Promise<void> => {
      const currentApp = state.electronApp;
      if (!currentApp) return;

      const tracePath = state.activeTracePath;
      state.activeTracePath = null;
      if (tracePath) {
        await Promise.race([
          currentApp
            .context()
            .tracing.stop({ path: tracePath })
            .catch(() => undefined),
          new Promise<void>((resolve) => setTimeout(resolve, 2_000))
        ]);
      }
      state.intentionalClose = true;
      try {
        await currentApp.close().catch(() => undefined);
        state.electronApp = null;
        state.page = null;
        await waitForServerState(false, PORT_RELEASE_WAIT_MS);
      } finally {
        state.intentionalClose = false;
      }
    };

    const relaunch = async (): Promise<Page> => {
      const page = await launch();
      await page.reload();
      await expect(page.getByAltText("Relay logo")).toBeVisible();
      await startTrace();
      return page;
    };

    const restart = async (): Promise<Page> => {
      await close();
      return relaunch();
    };
    const resize = async (width: number, height: number): Promise<void> => {
      if (!state.electronApp || !state.page) {
        throw new Error("Relay Electron is not running.");
      }
      await resizeElectronContent(state.electronApp, state.page, { width, height });
    };
    let fixtureFailed = false;
    let fixtureError: unknown;

    try {
      const page = await launch();
      seed = await seedBillingData(api, testRunId);
      await page.reload();
      await expect(page.getByAltText("Relay logo")).toBeVisible();
      await startTrace();

      const app = {
        get page() {
          if (!state.page) throw new Error("Relay Electron is not running.");
          return state.page;
        },
        get api() {
          return api;
        },
        get seed() {
          return seed;
        },
        get dataRoot() {
          return tempRoot;
        },
        get userDataPath() {
          return actualUserDataPath;
        },
        get databasePath() {
          return path.join(actualUserDataPath, "relay.db");
        },
        restart,
        close,
        relaunch,
        resize
      } satisfies RelayApp;

      await fixtureUse(app);
    } catch (error) {
      fixtureFailed = true;
      fixtureError = error;
    }

    const failed = fixtureFailed || testInfo.status !== testInfo.expectedStatus;
    let diagnosticError: unknown;
    if (failed && state.page && !state.page.isClosed()) {
      try {
        const screenshotPath = testInfo.outputPath("failure.png");
        await state.page.screenshot({ path: screenshotPath, fullPage: true });
        if (await fileExists(screenshotPath)) {
          await testInfo.attach("failure-screenshot", {
            path: screenshotPath,
            contentType: "image/png"
          });
        }
      } catch (error) {
        diagnosticError = error;
        mainLog.push(
          `[harness] Failure screenshot could not be retained: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    let closeError: unknown;
    try {
      await close();
    } catch (error) {
      closeError = error;
      mainLog.push(
        `[harness] Electron teardown failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
      );
    }

    if (failed || closeError) {
      try {
        await retainFailureArtifacts({
          testInfo,
          tempRoot,
          userDataPath: actualUserDataPath,
          tracePaths: state.tracePaths,
          mainLog,
          rendererConsole,
          rendererErrors,
          apiLog,
          seed,
          testRunId
        });
      } catch (error) {
        diagnosticError ??= error;
        mainLog.push(
          `[harness] Failure artifacts could not be retained: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    let cleanupError: unknown;
    await fs.rm(tempRoot, { recursive: true, force: true }).catch((error: unknown) => {
      cleanupError = error;
      mainLog.push(
        `[harness] Temporary-data cleanup failed: ${error instanceof Error ? error.message : String(error)}`
      );
    });

    // Preserve the assertion error first; surface harness errors only for an otherwise successful
    // journey, and only after all retention/cleanup steps have been attempted.
    if (fixtureError) throw fixtureError;
    if (closeError) throw closeError;
    if (diagnosticError) throw diagnosticError;
    if (cleanupError) {
      throw new Error(
        `Billing E2E temporary data could not be removed: ${
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        }`
      );
    }
  }
});

export { expect };

async function assertBuiltApplication(): Promise<void> {
  const missing = [];
  if (!(await fileExists(mainEntry))) missing.push(mainEntry);
  if (!(await fileExists(rendererEntry))) missing.push(rendererEntry);
  if (missing.length > 0) {
    throw new Error(
      `Electron E2E build output is missing: ${missing.join(", ")}. Run pnpm build:e2e first.`
    );
  }
}

async function assertDevelopmentPortIsFree(): Promise<void> {
  if (await serverResponds()) {
    throw new Error(
      "Port 4723 already has a Relay-compatible server. Refusing to seed or touch it; close the development app before running E2E."
    );
  }
}

function assertIsolatedUserData(userDataPath: string, appDataRoot: string): void {
  const resolvedUserData = path.resolve(userDataPath);
  const resolvedRoot = path.resolve(appDataRoot);
  const relative = path.relative(resolvedRoot, resolvedUserData);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    path.basename(resolvedUserData) !== "Relay-Dev"
  ) {
    throw new Error(
      `Unsafe Electron userData path "${resolvedUserData}". Expected Relay-Dev inside "${resolvedRoot}".`
    );
  }
}

async function waitForMainWindow(electronApp: ElectronApplication): Promise<Page> {
  const deadline = Date.now() + SERVER_WAIT_MS;
  while (Date.now() < deadline) {
    const windows = electronApp.windows().filter((candidate) => !candidate.isClosed());
    const mainPage = windows.find((candidate) => candidate.url().endsWith("/renderer/index.html"));
    // Fresh databases briefly show a migration window. Wait for the production
    // handoff to finish so OS focus/resize changes cannot destabilize UI actions.
    if (mainPage && windows.length === 1) {
      await mainPage.waitForLoadState("domcontentloaded").catch(() => undefined);
      if (!mainPage.isClosed()) {
        await mainPage.bringToFront();
        return mainPage;
      }
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  const urls = electronApp.windows().map((candidate) => candidate.url());
  throw new Error(
    `Timed out waiting for the Relay migration handoff. Open windows: ${urls.join(", ")}`
  );
}

async function resizeElectronContent(
  electronApp: ElectronApplication,
  page: Page,
  viewport: { width: number; height: number }
): Promise<void> {
  await electronApp.evaluate(({ BrowserWindow }, nextViewport) => {
    const window = BrowserWindow.getAllWindows().find(
      (candidate) => !candidate.webContents.getURL().includes("upgrade.html")
    );
    if (!window) throw new Error("Relay main BrowserWindow is unavailable.");
    window.setFullScreen(false);
    window.unmaximize();
    window.webContents.setZoomFactor(1);
    window.setContentSize(nextViewport.width, nextViewport.height, false);
  }, viewport);

  await expect
    .poll(() => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })), {
      message: `Electron content viewport must be ${viewport.width}x${viewport.height}`
    })
    .toEqual(viewport);
}

async function serverResponds(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 400);
  try {
    const response = await fetch(`${API_BASE_URL}/api/onboarding/status`, {
      signal: controller.signal
    });
    return response.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServerState(shouldRespond: boolean, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await serverResponds()) === shouldRespond) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    shouldRespond
      ? "Timed out waiting for the Relay Hono server on port 4723."
      : "Timed out waiting for Relay to release development port 4723."
  );
}

function attachMainProcessLogs(electronApp: ElectronApplication, log: string[]): void {
  electronApp.process().stdout?.on("data", (chunk: Buffer | string) => {
    log.push(`[stdout] ${String(chunk).trimEnd()}`);
  });
  electronApp.process().stderr?.on("data", (chunk: Buffer | string) => {
    log.push(`[stderr] ${String(chunk).trimEnd()}`);
  });
}

function attachRendererLogs(
  page: Page,
  consoleLog: string[],
  errorLog: string[],
  apiLog: ApiLogEntry[]
): void {
  page.on("console", (message) => {
    consoleLog.push(`[${new Date().toISOString()}] ${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errorLog.push(`[${new Date().toISOString()}] ${error.stack ?? error.message}`);
  });

  const starts = new WeakMap<Request, number>();
  const completed = new WeakSet<Request>();
  page.on("request", (request) => {
    if (request.url().includes("/api/")) starts.set(request, Date.now());
  });
  page.on("response", (response) => {
    const request = response.request();
    const startedAt = starts.get(request);
    if (startedAt === undefined || completed.has(request)) return;
    completed.add(request);
    apiLog.push({
      source: "renderer",
      method: request.method(),
      url: request.url(),
      status: response.status(),
      durationMs: Date.now() - startedAt
    });
  });
  page.on("requestfailed", (request) => {
    const startedAt = starts.get(request);
    if (startedAt === undefined || completed.has(request)) return;
    completed.add(request);
    apiLog.push({
      source: "renderer",
      method: request.method(),
      url: request.url(),
      status: "failed",
      durationMs: Date.now() - startedAt,
      failure: request.failure()?.errorText
    });
  });
}

async function retainFailureArtifacts(options: {
  testInfo: TestInfo;
  tempRoot: string;
  userDataPath: string;
  tracePaths: string[];
  mainLog: string[];
  rendererConsole: string[];
  rendererErrors: string[];
  apiLog: ApiLogEntry[];
  seed: BillingSeed | undefined;
  testRunId: string;
}): Promise<void> {
  const {
    testInfo,
    tempRoot,
    userDataPath,
    tracePaths,
    mainLog,
    rendererConsole,
    rendererErrors,
    apiLog,
    seed,
    testRunId
  } = options;

  const artifacts: Array<[string, string, string]> = [];
  const addTextArtifact = async (name: string, filename: string, value: unknown) => {
    const outputPath = testInfo.outputPath(filename);
    await fs.writeFile(
      outputPath,
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
      "utf8"
    );
    artifacts.push([name, outputPath, "text/plain"]);
  };

  await addTextArtifact("electron-main-log", "electron-main.log", mainLog.join("\n"));
  await addTextArtifact("renderer-console", "renderer-console.log", rendererConsole.join("\n"));
  await addTextArtifact("renderer-errors", "renderer-errors.log", rendererErrors.join("\n"));
  await addTextArtifact("api-timing-log", "api-timing.json", apiLog);
  await addTextArtifact("seed-identifiers", "seed.json", {
    testName: testInfo.titlePath,
    testRunId,
    tempRoot,
    userDataPath,
    seed
  });

  const databaseSource = userDataPath ? path.join(userDataPath, "relay.db") : null;
  if (databaseSource && (await fileExists(databaseSource))) {
    const databaseCopy = testInfo.outputPath("relay.db");
    await fs.copyFile(databaseSource, databaseCopy);
    artifacts.push(["isolated-relay.db", databaseCopy, "application/x-sqlite3"]);
  }

  for (const [index, traceSource] of tracePaths.entries()) {
    if (!(await fileExists(traceSource))) continue;
    const traceCopy = testInfo.outputPath(`trace-launch-${index + 1}.zip`);
    await fs.copyFile(traceSource, traceCopy);
    artifacts.push([`trace-launch-${index + 1}`, traceCopy, "application/zip"]);
  }

  for (const [name, artifactPath, contentType] of artifacts) {
    await testInfo.attach(name, { path: artifactPath, contentType });
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
