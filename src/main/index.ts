import { electronApp, is } from "@electron-toolkit/utils";
import dotenv from "dotenv";
import { app, BrowserWindow } from "electron";
import { join, resolve } from "node:path";
import { setupMenu } from "./setupMenu";

dotenv.config();

if (app.isPackaged && import.meta.env?.VITE_BUILD_MODE === "dev") {
  const devUserData = resolve(app.getPath("appData"), "QuickCart-Dev");
  app.setPath("userData", devUserData);
} else if (!app.isPackaged) {
  const localUserData = resolve(app.getPath("appData"), "QuickCart-Dev");
  app.setPath("userData", localUserData);
}

app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

let mainWindow: BrowserWindow;
const gotTheLock = app.requestSingleInstanceLock();

// prevent creating multiple instance
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
    electronApp.setAppUserModelId(
      import.meta.env.VITE_BUILD_MODE === "dev"
        ? "com.quickcart-dev.electron"
        : "com.quickcart.electron"
    );
    /**
     * have to load both modules at same time instead of one after other
     * forcing to load the modules after app.setPath() so that we can access app.getPath() in db.ts
     * this ensures the db path is valid & in exact location
     */
    const [{ startServer }, { setupIpcHandlers }] = await Promise.all([
      import("./server"),
      import("./setupIpcHandlers")
    ]);
    setupIpcHandlers();
    startServer();
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
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("ready-to-show", () => {
    setTimeout(() => {
      mainWindow.maximize();
    }, 25);
    mainWindow.show();
  });

  setupMenu();

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
