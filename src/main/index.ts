import { is } from "@electron-toolkit/utils";
import { app, BrowserWindow } from "electron";
import { fork, type ChildProcess } from "node:child_process";
import { join, resolve } from "node:path";
import { initMainEnv } from "./loadEnv";
import { handleAssetsProtocol, registerProtocol } from "./protocol";

const mode = initMainEnv(app.isPackaged);
const isDevBuild = mode === "development";
let serverProcess: ChildProcess;

registerProtocol();

if (isDevBuild) {
  app.setName("QuickCart-Dev");
} else {
  app.setName("QuickCart");
}

if (process.platform === "win32") {
  app.setAppUserModelId(isDevBuild ? "com.quickcart-dev.app" : "com.quickcart.app");
}

if (!app.isPackaged || isDevBuild) {
  app.setPath("userData", resolve(app.getPath("appData"), "QuickCart-Dev"));
}

let mainWindow: BrowserWindow;
const gotTheLock = app.requestSingleInstanceLock();

// prevent creating multiple instances
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    handleAssetsProtocol();
    /*
     * All main-process modules that touch app.getPath() are lazy-imported here,
     * have to load both modules at same time instead of one after other
     * forcing to load the modules after app.setPath() so that we can access app.getPath() in db.ts
     * this ensures the db path is valid & in exact location
     */
    const [{ setupIpcHandlers }] = await Promise.all([import("./setupIpcHandlers")]);
    setupIpcHandlers();

    serverProcess = fork(join(__dirname, "server.js"), [], {
      env: process.env,
      stdio: "inherit"
    });

    serverProcess.on("spawn", () => {
      console.info("Spawed child process");
    });

    serverProcess.on("error", (err) => {
      console.error("Failed to start Hono server", err);
    });

    createWindow();

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once("ready-to-show", async () => {
    // lazy import - electronStore must only load after app.setPath() has run
    const { store } = await import("./electronStore");
    const zoomFactor = store.get("zoomFactor") as number;
    mainWindow.webContents.setZoomFactor(zoomFactor);
    mainWindow.show();
    mainWindow.maximize();
  });

  import("./setupMenu").then(({ setupMenu }) => setupMenu());

  // catch keyboard events
  // https://stackoverflow.com/a/75716165/25649886
  mainWindow.webContents.on("before-input-event", (_, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      mainWindow.webContents.isDevToolsOpened()
        ? mainWindow.webContents.closeDevTools()
        : mainWindow.webContents.openDevTools({ mode: "right" });
    }
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
