import { Menu } from "electron";
import { checkForUpdates } from "./updater";

// Menu setup examples
// - https://www.electronjs.org/docs/latest/api/menu#examples
// - https://stackoverflow.com/questions/45811603/create-electron-menu-in-typescript

export function setupMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "View",
      submenu: [{ role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }]
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
