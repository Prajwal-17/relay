import { is } from "@electron-toolkit/utils";
import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { registerZoomController, restoreZoom, type ZoomStore } from "./zoom";

type MainWindowOptions = {
  isDevBuild: boolean;
  store?: ZoomStore;
};

export type MainWindowHandle = {
  window: BrowserWindow;
  ready: Promise<BrowserWindow>;
};

// creates the hidden app window and tells when it is ready to show
export function createMainWindow({ isDevBuild, store }: MainWindowOptions): MainWindowHandle {
  const apiPort = isDevBuild ? 4723 : 4722;
  const initialZoom = store ? (store.get("zoomFactor") as number) : 1;
  const { width: workAreaWidth, height: workAreaHeight } = screen.getPrimaryDisplay().workAreaSize;
  const contentWidth = Math.min(1280, Math.max(1024, workAreaWidth - 24));
  const contentHeight = Math.min(650, Math.max(600, workAreaHeight - 72));

  const window = new BrowserWindow({
    show: false,
    width: contentWidth,
    height: contentHeight,
    minWidth: 1024,
    minHeight: 600,
    useContentSize: true,
    autoHideMenuBar: !isDevBuild,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      zoomFactor: initialZoom,
      additionalArguments: [`--api-port=${apiPort}`]
    } as Electron.WebPreferences
  });

  const web = window.webContents; // window.webContents - rendering and controlling webpage

  // prevents zoom resets on change in window focus, close, open
  if (store) {
    registerZoomController(web);
    web.on("did-finish-load", () => restoreZoom(web, store));
    window.on("show", () => restoreZoom(web, store));
    window.on("restore", () => restoreZoom(web, store));
    window.on("focus", () => restoreZoom(web, store));
  }

  void import("./setupMenu").then(({ setupMenu }) => setupMenu({ autoHideMenuBar: !isDevBuild }));

  if (isDevBuild) {
    web.on("before-input-event", (_, input) => {
      if (input.type !== "keyDown" || input.key !== "F12") return;
      if (web.isDevToolsOpened()) web.closeDevTools();
      else web.openDevTools({ mode: "right" });
    });
  }

  // wait until everything loads then show window
  const ready = new Promise<BrowserWindow>((resolveReady, rejectReady) => {
    window.once("ready-to-show", () => {
      if (store) restoreZoom(web, store);
      window.maximize();
      resolveReady(window);
    });
    web.once("did-fail-load", (_event, errorCode, errorDescription) => {
      rejectReady(new Error(`QuickCart could not load (${errorCode}): ${errorDescription}`));
    });
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return { window, ready };
}
