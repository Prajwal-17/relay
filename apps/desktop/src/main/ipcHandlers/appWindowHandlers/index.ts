import { app, BrowserWindow, ipcMain } from "electron";
import { checkForUpdates } from "../../updater";

const windowFromEvent = (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) =>
  BrowserWindow.fromWebContents(event.sender);

export function appWindowHandlers() {
  ipcMain.handle("app-window:get-metadata", () => ({
    name: app.getName(),
    version: app.getVersion()
  }));

  ipcMain.handle("app-window:is-maximized", (event) => {
    return windowFromEvent(event)?.isMaximized() ?? false;
  });

  ipcMain.handle("app-window:toggle-maximize", (event) => {
    const window = windowFromEvent(event);
    if (!window) return false;

    if (window.isMaximized()) window.unmaximize();
    else window.maximize();

    return window.isMaximized();
  });

  ipcMain.on("app-window:minimize", (event) => windowFromEvent(event)?.minimize());
  ipcMain.on("app-window:close", (event) => windowFromEvent(event)?.close());
  ipcMain.on("app-window:reload", (event) => windowFromEvent(event)?.webContents.reload());
  ipcMain.on("app-window:check-for-updates", () => checkForUpdates());
}
