import { electronApp, is } from "@electron-toolkit/utils";
import dotenv from "dotenv";
import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { startServer } from "./server";
import { setupIpcHandlers } from "./setupIpcHandlers";
import { setupMenu } from "./setupMenu";

dotenv.config();

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

  app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.quickcart.electron");
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
