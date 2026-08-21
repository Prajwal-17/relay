import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { resolveApiPort } from "../shared/runtimeConfig";
import type { DatabaseUpgradeStatus } from "../shared/types";
import type { UpgradeInspection } from "./db/upgradeCoordinator";
import { initMainEnv } from "./loadEnv";
import { createMainWindow } from "./mainWindow";
import { handleAssetsProtocol, registerProtocol } from "./protocol";
import { startServerProcess, stopServerProcess } from "./serverProcess";
import { UpgradeWindowController } from "./upgrade/upgradeWindow";
import type { ZoomStore } from "./zoom";

const isDevBuild = initMainEnv() === "development";
let mainWindow: BrowserWindow | undefined;
const apiPort = resolveApiPort(process.env.M_VITE_API_PORT, process.env.MODE);
let appStore: ZoomStore | undefined;
let upgradeWindow: UpgradeWindowController | undefined;
let bootPromise: Promise<void> | undefined;
let applicationStarted = false;

app.setName(isDevBuild ? "QuickCart-Dev" : "QuickCart");

if (process.platform === "win32") {
  app.setAppUserModelId(isDevBuild ? "com.quickcart-dev.app" : "com.quickcart.app");
}

const configuredUserDataDirectory = process.env.M_VITE_USER_DATA_DIR;
if (configuredUserDataDirectory) {
  if (!isAbsolute(configuredUserDataDirectory)) {
    throw new Error("M_VITE_USER_DATA_DIR must be an absolute path.");
  }
  if (!fs.existsSync(configuredUserDataDirectory)) {
    throw new Error("M_VITE_USER_DATA_DIR must exist before QuickCart starts.");
  }
  if (!fs.statSync(configuredUserDataDirectory).isDirectory()) {
    throw new Error("M_VITE_USER_DATA_DIR must point to a directory.");
  }
  app.setPath("userData", configuredUserDataDirectory);
} else if (isDevBuild) {
  // Keep normal development data separate from the installed app.
  app.setPath("userData", resolve(app.getPath("appData"), "QuickCart-Dev"));
}

process.env.M_VITE_API_PORT = String(apiPort);
registerProtocol();

// Path-dependent database modules are loaded only after userData is final.
const databaseModules = Promise.all([
  import("./db/backup"),
  import("./db/db"),
  import("./db/upgradeCoordinator")
]).then(([backup, database, upgrade]) => ({ ...backup, ...database, ...upgrade }));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // second-instance => to bring already opened window when clicked twice on app
  app.on("second-instance", () => {
    if (upgradeWindow) {
      upgradeWindow.focus();
      return;
    }
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    handleAssetsProtocol();

    const [{ setupIpcHandlers }, { store }] = await Promise.all([
      import("./setupIpcHandlers"),
      import("./electronStore")
    ]);
    appStore = store;
    setupIpcHandlers();

    // these values are passed to the forked server process.
    process.env.M_VITE_DATABASE_URL = join(app.getPath("userData"), "pos.db");
    process.env.M_VITE_IS_PACKAGED = String(app.isPackaged);
    process.env.M_VITE_MIGRATION_FOLDER = app.isPackaged
      ? join(process.resourcesPath, "drizzle")
      : join(__dirname, "../../drizzle");

    await boot();

    app.on("activate", async () => {
      // window re-opening behaviour
      if (applicationStarted && BrowserWindow.getAllWindows().length === 0) {
        const window = await openMainWindow();
        window.show();
      }
    });
  });
}

function checkingStatus(totalSteps: number, backupAvailable: boolean): DatabaseUpgradeStatus {
  return {
    state: "checking",
    label: "Checking your local database",
    currentStep: 0,
    totalSteps: Math.max(totalSteps, 1),
    backupAvailable
  };
}

function errorMessage(error: unknown): string {
  let current = error;
  let message = "";

  while (current instanceof Error) {
    if (current.message.trim()) message = current.message;
    current = current.cause;
  }

  return message || "QuickCart could not update the local database.";
}

async function ensureUpgradeWindow(
  inspection: Pick<UpgradeInspection, "isFreshDatabase" | "totalSteps" | "backupDirectory">
): Promise<UpgradeWindowController> {
  if (upgradeWindow) return upgradeWindow;

  const { getBackupPaths, getDatabasePath } = await databaseModules;
  const backupAvailable = fs.existsSync(getBackupPaths(getDatabasePath()).latest);
  upgradeWindow = new UpgradeWindowController({
    isFreshDatabase: inspection.isFreshDatabase,
    initialStatus: checkingStatus(inspection.totalSteps, backupAvailable),
    backupDirectory: inspection.backupDirectory,
    preloadPath: join(__dirname, "../preload/index.js"),
    rendererUrl: isDevBuild ? process.env.ELECTRON_RENDERER_URL : undefined,
    onRetry: retryBoot
  });
  await upgradeWindow.create();
  return upgradeWindow;
}

async function retryBoot(): Promise<void> {
  const activeBoot = bootPromise;
  if (activeBoot) await activeBoot;
  await boot();
}

async function boot(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = runBoot().finally(() => {
    bootPromise = undefined;
  });
  return bootPromise;
}

async function runBoot(): Promise<void> {
  const { getBackupPaths, getDatabasePath, getMigrationsFolder, initDb, inspectDatabaseUpgrade } =
    await databaseModules;
  const databasePath = getDatabasePath();
  const migrationsFolder = getMigrationsFolder();
  let inspection: UpgradeInspection | undefined;

  try {
    inspection = inspectDatabaseUpgrade(databasePath, migrationsFolder);
    if (inspection.required) {
      const controller = await ensureUpgradeWindow(inspection);
      controller.update(
        checkingStatus(inspection.totalSteps, fs.existsSync(getBackupPaths(databasePath).latest))
      );
    }

    await initDb({ onStatus: (status) => upgradeWindow?.update(status) });
    await startApplication(inspection);
  } catch (error) {
    console.error("Database upgrade or startup failed", error);
    stopServerProcess();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();

    const fallback = inspection ?? {
      isFreshDatabase: !fs.existsSync(databasePath),
      totalSteps: 1,
      backupDirectory: getBackupPaths(databasePath).directory
    };
    const controller = await ensureUpgradeWindow(fallback);
    const previous = controller.getStatus();
    controller.update({
      state: "failed",
      label: "Database update stopped",
      currentStep: previous.currentStep,
      totalSteps: previous.totalSteps,
      backupAvailable: fs.existsSync(getBackupPaths(databasePath).latest),
      errorMessage: errorMessage(error)
    });
  }
}

async function startApplication(inspection?: UpgradeInspection): Promise<void> {
  if (applicationStarted) return;

  if (upgradeWindow) {
    const previous = upgradeWindow.getStatus();
    const totalSteps = Math.max(inspection?.totalSteps ?? previous.totalSteps, 1);
    upgradeWindow.update({
      state: "starting",
      label: "Starting QuickCart",
      currentStep: totalSteps,
      totalSteps,
      backupAvailable: previous.backupAvailable
    });
  }

  await startServerProcess();
  const window = await openMainWindow();
  window.show();
  applicationStarted = true;

  if (!upgradeWindow) return;
  upgradeWindow.update({
    ...upgradeWindow.getStatus(),
    state: "complete",
    label: "QuickCart is ready"
  });
  upgradeWindow.close();
  upgradeWindow = undefined;
}

async function openMainWindow(): Promise<BrowserWindow> {
  const handle = createMainWindow({
    isDevBuild,
    apiPort,
    maximizeOnReady: !configuredUserDataDirectory,
    store: appStore
  });
  mainWindow = handle.window;
  handle.window.on("closed", () => {
    if (mainWindow === handle.window) mainWindow = undefined;
  });
  return handle.ready;
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && applicationStarted) app.quit();
});

app.on("will-quit", () => stopServerProcess());
