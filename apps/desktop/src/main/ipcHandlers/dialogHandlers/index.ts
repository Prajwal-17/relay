import { BrowserWindow, dialog } from "electron";
import { ipcMain } from "electron/main";

// this is modal dialog, attached to the main BrowserWindow & user cant interact with mainWindow until dialog resolved
// non-modal dialog, not attached to main BrowserWindow and user can interact with mainWindow if dialog unresolved
export function dialogHandlers() {
  ipcMain.handle("dialog:selectFolder", async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await (focusedWindow
      ? dialog.showOpenDialog(focusedWindow, {
          properties: ["openDirectory"],
          title: "Select default PDF save location"
        })
      : dialog.showOpenDialog({
          properties: ["openDirectory"],
          title: "Select default PDF save location"
        }));

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}
