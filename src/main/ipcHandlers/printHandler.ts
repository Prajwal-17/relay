import { BrowserWindow, ipcMain } from "electron";

export function printHandler() {
  ipcMain.on("print-receipt", async (_event, html) => {
    const win = new BrowserWindow({ show: false });
    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

    win.webContents.on("did-finish-load", () => {
      win.webContents.print(
        {
          silent: false, // true = no dialog
          printBackground: true
          // deviceName: "YOUR_PRINTER_NAME" // optional
        },
        (success, errorType) => {
          if (!success) console.error("Print failed:", errorType);
          win.close();
        }
      );
    });
  });
}
