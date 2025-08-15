import { electronApp, is } from "@electron-toolkit/utils";
import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { setupIpcHandlers } from "./setupIpcHandlers";

app.commandLine.appendSwitch("high-dpi-support", "1"); // enable high dpi
app.commandLine.appendSwitch("force-device-scale-factor", "1"); // overrides device scale factor

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      zoomFactor: 1,
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  setupIpcHandlers();
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
