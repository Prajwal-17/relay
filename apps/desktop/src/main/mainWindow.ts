import { is } from "@electron-toolkit/utils";
import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { registerZoomController, restoreZoom, type ZoomStore } from "./zoom";

type MainWindowOptions = {
  isDevBuild: boolean;
  store?: ZoomStore;
  apiPort: number;
  apiToken: string;
  maximizeOnReady?: boolean;
};

export type MainWindowHandle = {
  window: BrowserWindow;
  ready: Promise<BrowserWindow>;
};

// creates the hidden app window and tells when it is ready to show
export function createMainWindow({
  isDevBuild,
  apiPort,
  apiToken,
  maximizeOnReady = true,
  store
}: MainWindowOptions): MainWindowHandle {
  const initialZoom = store ? (store.get("zoomFactor") as number) : 1;
  const windowTitle = isDevBuild ? "QuickCart — Development" : "QuickCart";
  const { width: workAreaWidth, height: workAreaHeight } = screen.getPrimaryDisplay().workAreaSize;
  const contentWidth = maximizeOnReady ? Math.min(1280, Math.max(1024, workAreaWidth - 24)) : 1280;
  const contentHeight = maximizeOnReady ? Math.min(650, Math.max(600, workAreaHeight - 72)) : 650;

  const window = new BrowserWindow({
    title: windowTitle,
    show: false,
    width: contentWidth,
    height: contentHeight,
    minWidth: 1024,
    minHeight: 600,
    useContentSize: true,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      zoomFactor: initialZoom,
      additionalArguments: [`--api-port=${apiPort}`, `--api-token=${apiToken}`]
    } as Electron.WebPreferences
  });

  const web = window.webContents; // window.webContents - rendering and controlling webpage

  // Keep the environment marker when the renderer document title is applied after loading.
  web.on("page-title-updated", (event) => {
    event.preventDefault();
    window.setTitle(windowTitle);
  });

  // prevents zoom resets on change in window focus, close, open
  if (store) {
    registerZoomController(web);
    web.on("did-finish-load", () => restoreZoom(web, store));
    window.on("show", () => restoreZoom(web, store));
    window.on("restore", () => restoreZoom(web, store));
    window.on("focus", () => restoreZoom(web, store));
  }

  void import("./setupMenu").then(({ setupMenu }) => setupMenu({ autoHideMenuBar: false }));

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
      if (maximizeOnReady) window.maximize();
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
