import { dialog } from "electron";
import { autoUpdater } from "electron-updater";

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on("error", (error) => {
  dialog.showErrorBox("Error: ", error == null ? "unknown" : (error.stack || error).toString());
});

autoUpdater.on("update-available", () => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Found Updates",
      message: "Found updates, do you want update now?",
      buttons: ["Yes", "No"]
    })
    .then((buttonIndex) => {
      if (buttonIndex.response === 0) {
        autoUpdater.downloadUpdate();
      } else {
        updater.enabled = true;
        updater = null;
      }
    });
});

autoUpdater.on("update-not-available", () => {
  dialog.showMessageBox({
    title: "No Updates",
    message: "Current version is up-to-date."
  });
  updater.enabled = true;
  updater = null;
});

autoUpdater.on("update-downloaded", () => {
  dialog
    .showMessageBox({
      title: "Install Updates",
      message: "Updates downloaded, application will be quit for update..."
    })
    .then(() => {
      setImmediate(() => autoUpdater.quitAndInstall());
    });
});

export function checkForUpdates(menuItem) {
  updater = menuItem;
  updater.enabled = false;
  autoUpdater.checkForUpdatesAndNotify();
}
