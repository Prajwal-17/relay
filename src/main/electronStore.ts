import { app } from "electron";
import Store from "electron-store";
import { resolve } from "node:path";

const isDevBuild = import.meta.env.VITE_BUILD_MODE === "dev";
const folderName = isDevBuild || !app.isPackaged ? "QuickCart-Dev" : "QuickCart";

export const store = new Store({
  cwd: resolve(app.getPath("appData"), folderName),
  defaults: {
    zoomFactor: 1
  }
});
