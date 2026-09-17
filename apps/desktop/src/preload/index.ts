import { contextBridge, ipcRenderer } from "electron";
import type {
  AppWindowApi,
  DatabaseUpgradeApi,
  DatabaseUpgradeStatus,
  DialogApi,
  ExportApi,
  ProductsApi,
  RawPrintApi,
  TransactionType,
  ZoomApi
} from "../shared/types";

const isMainWindow = process.argv.includes("--window-kind=main");

const appWindowApi: AppWindowApi = {
  getMetadata: () => ipcRenderer.invoke("app-window:get-metadata"),
  isMaximized: () => ipcRenderer.invoke("app-window:is-maximized"),
  toggleMaximize: () => ipcRenderer.invoke("app-window:toggle-maximize"),
  minimize: () => ipcRenderer.send("app-window:minimize"),
  close: () => ipcRenderer.send("app-window:close"),
  reload: () => ipcRenderer.send("app-window:reload"),
  checkForUpdates: () => ipcRenderer.send("app-window:check-for-updates"),
  onMaximizedChange: (listener: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
      listener(isMaximized);
    };
    ipcRenderer.on("app-window:maximized-changed", handler);
    return () => ipcRenderer.removeListener("app-window:maximized-changed", handler);
  }
};

const productsApi: ProductsApi = {
  saveProductImage: (dataUrl: string) => ipcRenderer.invoke("products:saveProductImage", dataUrl),
  deleteProductImage: (imageId: string) =>
    ipcRenderer.invoke("products:deleteProductImage", imageId)
};

const dialogApi: DialogApi = {
  selectFolder: () => ipcRenderer.invoke("dialog:selectFolder")
};

const exportApi: ExportApi = {
  exportAsPdf: (id: string, type: TransactionType) =>
    ipcRenderer.invoke("txn:exportAsPdf", id, type),
  showItemInFolder: (path: string) => ipcRenderer.send("show-item-in-folder", path)
};

const rawPrintApi: RawPrintApi = {
  listPrinters: () => ipcRenderer.invoke("printer:list"),
  printReceipt: (receipt, raster) => ipcRenderer.invoke("printer:raw-receipt", receipt, raster),
  printLedger: (statement, raster) => ipcRenderer.invoke("printer:raw-ledger", statement, raster),
  printReceiptWithLedger: (receipt, statement, receiptRaster, ledgerRaster) =>
    ipcRenderer.invoke(
      "printer:raw-receipt-with-ledger",
      receipt,
      statement,
      receiptRaster,
      ledgerRaster
    )
};

const zoomApi: ZoomApi = {
  getZoom: () => ipcRenderer.invoke("zoom:get"),
  setZoom: (factor: number) => ipcRenderer.invoke("zoom:set", factor),
  getBounds: () => ipcRenderer.invoke("zoom:bounds")
};

const databaseUpgradeApi: DatabaseUpgradeApi = {
  getStatus: () => ipcRenderer.invoke("database-upgrade:get-status"),
  onStatus: (listener: (status: DatabaseUpgradeStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: DatabaseUpgradeStatus) => {
      listener(status);
    };
    ipcRenderer.on("database-upgrade:status", handler);
    return () => ipcRenderer.removeListener("database-upgrade:status", handler);
  },
  retry: () => ipcRenderer.invoke("database-upgrade:retry"),
  openBackupFolder: () => ipcRenderer.invoke("database-upgrade:open-backup-folder"),
  quit: () => ipcRenderer.send("database-upgrade:quit")
};

const apiArg = process.argv.find((a) => a.startsWith("--api-port="));
const apiPort = apiArg ? Number(apiArg.split("=")[1]) : 4722;
const apiTokenArg = process.argv.find((argument) => argument.startsWith("--api-token="));
const apiToken = apiTokenArg?.slice("--api-token=".length) ?? "";

if (process.contextIsolated) {
  try {
    if (isMainWindow) contextBridge.exposeInMainWorld("appWindowApi", appWindowApi);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("dialogApi", dialogApi);
    contextBridge.exposeInMainWorld("exportApi", exportApi);
    contextBridge.exposeInMainWorld("zoomApi", zoomApi);
    contextBridge.exposeInMainWorld("rawPrintApi", rawPrintApi);
    contextBridge.exposeInMainWorld("databaseUpgradeApi", databaseUpgradeApi);
    contextBridge.exposeInMainWorld("env", {
      API_URL: `http://127.0.0.1:${apiPort}`,
      API_TOKEN: apiToken
    });
  } catch (error) {
    console.error(error);
  }
} else {
  if (isMainWindow) {
    // @ts-ignore (define in ts)
    window.appWindowApi = appWindowApi;
  }
  // @ts-ignore (define in ts)
  window.productsApi = productsApi;
  // @ts-ignore (define in ts)
  window.dialogApi = dialogApi;
  // @ts-ignore (define in ts)
  window.exportApi = exportApi;
  // @ts-ignore (define in ts)
  window.rawPrintApi = rawPrintApi;
  // @ts-ignore (define in ts)
  window.zoomApi = zoomApi;
  // @ts-ignore (define in ts)
  window.databaseUpgradeApi = databaseUpgradeApi;
  // @ts-ignore (define in ts)
  window.env = { API_URL: `http://127.0.0.1:${apiPort}`, API_TOKEN: apiToken };
}
