import { chromium, test as base, type Browser, type Page, type TestInfo } from "@playwright/test";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { promises as fs } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { PublicApi } from "../helpers/api";

const desktopRoot = path.resolve(__dirname, "../..");
const STARTUP_TIMEOUT_MS = 45_000;

type LaunchState = {
  process: ChildProcess;
  browser: Browser;
  page: Page;
  apiPort: number;
  debuggingPort: number;
  intentionalStop: boolean;
};

export class DevelopmentElectron {
  readonly tempRoot: string;
  readonly userDataDirectory: string;
  readonly databasePath: string;
  readonly output: string[] = [];
  readonly rendererErrors: string[] = [];
  readonly failedApiResponses: string[] = [];
  private state: LaunchState | null = null;
  private unexpectedExit: string | null = null;

  private constructor(tempRoot: string) {
    this.tempRoot = tempRoot;
    this.userDataDirectory = path.join(tempRoot, "user-data");
    this.databasePath = path.join(this.userDataDirectory, "relay.db");
  }

  static async create(): Promise<DevelopmentElectron> {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "relay-electron-e2e-"));
    const runtime = new DevelopmentElectron(tempRoot);
    await fs.mkdir(runtime.userDataDirectory, { recursive: true });
    await runtime.start();
    return runtime;
  }

  get page(): Page {
    if (!this.state) throw new Error("Development Electron is not running.");
    return this.state.page;
  }

  get api(): PublicApi {
    if (!this.state) throw new Error("Development Electron is not running.");
    return new PublicApi(`http://127.0.0.1:${this.state.apiPort}`);
  }

  get apiPort(): number {
    if (!this.state) throw new Error("Development Electron is not running.");
    return this.state.apiPort;
  }

  async restart(): Promise<Page> {
    await this.stop();
    await this.start();
    return this.page;
  }

  async start(): Promise<void> {
    if (this.state) throw new Error("Development Electron is already running.");
    this.unexpectedExit = null;
    const startupStartedAt = Date.now();
    const startupDeadline = startupStartedAt + STARTUP_TIMEOUT_MS;
    const reportStartup = (message: string) => {
      const elapsedSeconds = ((Date.now() - startupStartedAt) / 1000).toFixed(1);
      const line = `[e2e startup +${elapsedSeconds}s] ${message}`;
      this.output.push(line);
      console.log(line);
    };
    const [apiPort, debuggingPort] = await Promise.all([allocatePort(), allocatePort()]);
    const env = Object.fromEntries(
      Object.entries({
        ...process.env,
        MODE: "development",
        NODE_ENV: "development",
        ELECTRON_DISABLE_SANDBOX: "1",
        M_VITE_USER_DATA_DIR: this.userDataDirectory,
        M_VITE_API_PORT: String(apiPort)
      }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    );
    delete env.ELECTRON_RUN_AS_NODE;

    reportStartup(`launching Electron (API ${apiPort}, CDP ${debuggingPort})`);
    const child = spawn(
      "pnpm",
      [
        "exec",
        "electron-vite",
        "dev",
        "--mode",
        "development",
        "--remoteDebuggingPort",
        String(debuggingPort)
      ],
      {
        cwd: desktopRoot,
        env,
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    const provisional: {
      process: ChildProcess;
      browser: Browser | null;
      page: Page | null;
      apiPort: number;
      debuggingPort: number;
      intentionalStop: boolean;
    } = {
      process: child,
      browser: null,
      page: null,
      apiPort,
      debuggingPort,
      intentionalStop: false
    };

    const recordOutput = (source: "stdout" | "stderr", chunk: Buffer | string) => {
      this.output.push(`[${source}] ${String(chunk).trimEnd()}`);
    };
    child.stdout?.on("data", (chunk) => recordOutput("stdout", chunk));
    child.stderr?.on("data", (chunk) => recordOutput("stderr", chunk));
    child.once("exit", (code, signal) => {
      if (!provisional.intentionalStop) {
        this.unexpectedExit = `electron-vite dev exited unexpectedly (${signal ?? code ?? "unknown"}).`;
      }
    });
    child.once("error", (error) => {
      this.unexpectedExit = `electron-vite dev failed to start: ${error.message}`;
    });

    try {
      await waitForCdp(debuggingPort, child, startupDeadline);
      reportStartup("CDP is ready");
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${debuggingPort}`, {
        timeout: remainingMilliseconds(startupDeadline)
      });
      provisional.browser = browser;
      const page = await waitForMainRenderer(browser, child, startupDeadline);
      reportStartup("main renderer is ready");
      provisional.page = page;
      this.attachPageDiagnostics(page, apiPort);
      this.state = { ...provisional, browser, page };
      await resizeToCanonicalViewport(page);
      await assertCanonicalViewport(page);
      await waitForApi(apiPort, child, startupDeadline);
      reportStartup("local API is ready");
    } catch (error) {
      reportStartup(`failed: ${error instanceof Error ? error.message : String(error)}`);
      provisional.intentionalStop = true;
      await terminateProcessGroup(child);
      await provisional.browser?.close().catch(() => undefined);
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}\n\n${this.output.join("\n")}`
      );
    }
  }

  private attachPageDiagnostics(page: Page, apiPort: number): void {
    page.on("pageerror", (error) => this.rendererErrors.push(error.stack ?? error.message));
    page.on("response", (response) => {
      const url = response.url();
      if (url.startsWith(`http://localhost:${apiPort}`) && response.status() >= 500) {
        this.failedApiResponses.push(`${response.status()} ${response.request().method()} ${url}`);
      }
    });
  }

  async stop(): Promise<void> {
    const state = this.state;
    if (!state) return;
    this.state = null;
    state.intentionalStop = true;
    console.log("[e2e teardown] stopping Electron");
    await terminateProcessGroup(state.process);
    await state.browser.close().catch(() => undefined);
    console.log("[e2e teardown] Electron stopped");
  }

  async dispose(): Promise<void> {
    await this.stop();
    await fs.rm(this.tempRoot, { recursive: true, force: true });
  }

  assertHealthy(): void {
    if (this.unexpectedExit) throw new Error(this.unexpectedExit);
    if (this.rendererErrors.length) {
      throw new Error(`Unexpected renderer errors:\n${this.rendererErrors.join("\n")}`);
    }
    if (this.failedApiResponses.length) {
      throw new Error(`Unhandled API failures:\n${this.failedApiResponses.join("\n")}`);
    }
  }

  async attachDiagnostics(testInfo: TestInfo): Promise<void> {
    await testInfo.attach("electron-vite-output", {
      body: Buffer.from(this.output.join("\n")),
      contentType: "text/plain"
    });
    if (this.rendererErrors.length) {
      await testInfo.attach("renderer-errors", {
        body: Buffer.from(this.rendererErrors.join("\n")),
        contentType: "text/plain"
      });
    }
  }
}

type Fixtures = { developmentElectron: DevelopmentElectron };

export const test = base.extend<Fixtures>({
  developmentElectron: [
    // Playwright requires destructuring even when the fixture has no dependencies.
    // eslint-disable-next-line no-empty-pattern
    async ({}, runFixture, testInfo) => {
      const runtime = await DevelopmentElectron.create();
      let fixtureError: unknown;
      try {
        await runFixture(runtime);
        runtime.assertHealthy();
      } catch (error) {
        fixtureError = error;
      } finally {
        if (fixtureError || testInfo.status !== testInfo.expectedStatus) {
          await runtime.attachDiagnostics(testInfo);
        }
        await runtime.dispose();
      }
      if (fixtureError) throw fixtureError;
    },
    { timeout: STARTUP_TIMEOUT_MS + 15_000 }
  ]
});

export { expect } from "@playwright/test";

async function allocatePort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a test port.");
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return port;
}

async function waitForCdp(port: number, child: ChildProcess, deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("electron-vite dev stopped before CDP was ready.");
    try {
      const response = await fetchWithDeadline(`http://127.0.0.1:${port}/json/version`, deadline);
      if (response.ok) return;
    } catch {
      // Development compilation and Electron startup are still in progress.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for Electron CDP on port ${port}.`);
}

async function waitForApi(port: number, child: ChildProcess, deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error("electron-vite dev stopped before Hono was ready.");
    try {
      const response = await fetchWithDeadline(
        `http://127.0.0.1:${port}/api/onboarding/status`,
        deadline
      );
      if (response.ok) return;
    } catch {
      // The forked Hono service is still starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for Hono on port ${port}.`);
}

async function waitForMainRenderer(
  browser: Browser,
  child: ChildProcess,
  deadline: number
): Promise<Page> {
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error("electron-vite dev stopped before the renderer opened.");
    for (const context of browser.contexts()) {
      for (const page of context.pages()) {
        const url = page.url();
        if (!url || url === "about:blank" || url.includes("upgrade.html")) continue;
        await page
          .waitForLoadState("domcontentloaded", {
            timeout: Math.min(1_000, remainingMilliseconds(deadline))
          })
          .catch(() => undefined);
        if (
          await page
            .locator("body")
            .isVisible()
            .catch(() => false)
        )
          return page;
      }
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for the main development renderer.");
}

async function fetchWithDeadline(url: string, deadline: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(1_000, remainingMilliseconds(deadline))
  );
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function remainingMilliseconds(deadline: number): number {
  return Math.max(1, deadline - Date.now());
}

async function resizeToCanonicalViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 650 });
}

async function assertCanonicalViewport(page: Page): Promise<void> {
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  if (viewport.width !== 1280 || viewport.height !== 650) {
    throw new Error(
      `Expected Electron content area 1280x650, received ${viewport.width}x${viewport.height}.`
    );
  }
}

async function terminateProcessGroup(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }
  const exited = await Promise.race([
    new Promise<boolean>((resolve) => child.once("exit", () => resolve(true))),
    delay(3_000).then(() => false)
  ]);
  if (!exited) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // The exact process group exited between checks.
    }
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
