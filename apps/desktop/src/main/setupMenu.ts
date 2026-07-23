import { BrowserWindow, Menu } from "electron";
import { store } from "./electronStore";
import { checkForUpdates } from "./updater";
import { setZoom } from "./zoom";

// Menu setup examples
// - https://www.electronjs.org/docs/latest/api/menu#examples
// - https://stackoverflow.com/questions/45811603/create-electron-menu-in-typescript

export function setupMenu({ autoHideMenuBar = true }: { autoHideMenuBar?: boolean } = {}) {
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
            setZoom(win.webContents, store, win.webContents.getZoomFactor() + 0.1);
          }
        },
        {
          label: "Zoom Out",
          accelerator: "CmdorCtrl+-",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            setZoom(win.webContents, store, win.webContents.getZoomFactor() - 0.1);
          }
        },
        {
          label: "Reset",
          accelerator: "CmdorCtrl+0",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            setZoom(win.webContents, store, 1);
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

  for (const window of BrowserWindow.getAllWindows()) {
    window.setAutoHideMenuBar(autoHideMenuBar);
    window.setMenuBarVisibility(!autoHideMenuBar);
  }
}
