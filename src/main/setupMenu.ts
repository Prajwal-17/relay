import { Menu } from "electron";

// Menu setup examples
// - https://www.electronjs.org/docs/latest/api/menu#examples
// - https://stackoverflow.com/questions/45811603/create-electron-menu-in-typescript

export function setupMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    // {
    //   label: "Edit",
    //   submenu: [
    //     { role: "undo" },
    //     { role: "redo" },
    //     { type: "separator" },
    //     { role: "cut" },
    //     { role: "copy" },
    //     { role: "paste" },
    //     { role: "pasteAndMatchStyle" },
    //     { role: "delete" },
    //     { role: "selectAll" }
    //   ]
    // },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" }
        // { type: "separator" },
        // { role: "resetZoom" },
        // { role: "zoomIn" },
        // { role: "zoomOut" },
        // { type: "separator" },
        // { role: "togglefullscreen" }
      ]
    },

    { role: "window", submenu: [{ role: "minimize" }, { role: "close" }] }
    // {
    //   role: "help",
    //   submenu: [
    //     {
    //       label: "Learn More",
    //       click() {
    //         electron.shell.openExternal("https://electron.atom.io");
    //       }
    //     }
    //   ]
    // }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
