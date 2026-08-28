import { BrowserWindow, ipcMain } from "electron";
import { store } from "../../electronStore";
import { getZoom, MAX_ZOOM, MIN_ZOOM, setZoom } from "../../zoom";

export function zoomHandlers() {
  ipcMain.handle("zoom:get", () => {
    return { zoomFactor: getZoom() };
  });

  ipcMain.handle("zoom:set", (_event, factor: number) => {
    const web = BrowserWindow.getFocusedWindow()?.webContents;
    if (web) {
      setZoom(web, store, factor);
    }
    return { zoomFactor: getZoom() };
  });

  ipcMain.handle("zoom:bounds", () => {
    return { min: MIN_ZOOM, max: MAX_ZOOM, default: 1 };
  });
}
