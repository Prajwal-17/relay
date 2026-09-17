import { dialog } from "electron";
import { autoUpdater } from "electron-updater";

let isCheckingForUpdates = false;
autoUpdater.autoDownload = false;

autoUpdater.on("error", (error) => {
  isCheckingForUpdates = false;
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
        isCheckingForUpdates = false;
      }
    });
});

autoUpdater.on("update-not-available", () => {
  dialog.showMessageBox({
    title: "No Updates",
    message: "Current version is up-to-date."
  });
  isCheckingForUpdates = false;
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

export function checkForUpdates() {
  if (isCheckingForUpdates) return;
  isCheckingForUpdates = true;
  void autoUpdater.checkForUpdatesAndNotify();
}
