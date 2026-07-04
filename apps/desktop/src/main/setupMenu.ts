import { BrowserWindow, Menu } from "electron";
import { store } from "./electronStore";
import { checkForUpdates } from "./updater";

// Menu setup examples
// - https://www.electronjs.org/docs/latest/api/menu#examples
// - https://stackoverflow.com/questions/45811603/create-electron-menu-in-typescript

export function setupMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        {
          label: "Zoom In",
          accelerator: "CmdorCtrl+=",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const web = win.webContents;
            const zoom = web.getZoomFactor();
            store.set("zoomFactor", zoom + 0.1);
            web.setZoomFactor(zoom + 0.1);
          }
        },
        {
          label: "Zoom Out",
          accelerator: "CmdorCtrl+-",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const web = win.webContents;
            const zoom = web.getZoomFactor();
            store.set("zoomFactor", zoom - 0.1);
            web.setZoomFactor(zoom - 0.1);
          }
        },
        {
          label: "Reset",
          accelerator: "CmdorCtrl+0",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const web = win.webContents;
            store.set("zoomFactor", 1);
            web.setZoomFactor(1);
          }
        }
      ]
    },
    { role: "window", submenu: [{ role: "minimize" }, { role: "close" }] },
    {
      label: "Help",
      submenu: [
        {
          label: "Check for updates",
          click(menuItem) {
            checkForUpdates(menuItem);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
