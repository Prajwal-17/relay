import { is } from "@electron-toolkit/utils";
import dotenv from "dotenv";
import { app, BrowserWindow } from "electron";
import { join, resolve } from "node:path";

dotenv.config();

const isDevBuild = import.meta.env.VITE_BUILD_MODE === "dev";

if (isDevBuild) {
  app.setName("QuickCart-Dev");
} else {
  app.setName("QuickCart");
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
    if (process.platform === "win32") {
      app.setAppUserModelId(
        import.meta.env.VITE_BUILD_MODE === "dev" ? "com.quickcart-dev.app" : "com.quickcart.app"
      );
    }

    /**
     * All main-process modules that touch app.getPath() are lazy-imported here,
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
