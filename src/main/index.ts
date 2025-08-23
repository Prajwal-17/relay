import { electronApp, is } from "@electron-toolkit/utils";
import { app, BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { setupIpcHandlers } from "./setupIpcHandlers";
import { setupMenu } from "./setupMenu";

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

  app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.electron");
    setupIpcHandlers();
    createWindow();

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function createWindow(): void {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const zoomLevel = width <= 1355 ? 0.75 : 1.0;

  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      zoomFactor: zoomLevel,
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
