import { contextBridge, ipcRenderer } from "electron";
import type {
  DatabaseUpgradeApi,
  DatabaseUpgradeStatus,
  DialogApi,
  ExportApi,
  ProductsApi,
  TransactionType,
  ZoomApi
} from "../shared/types";

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

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      printReceipt: (html: string) => ipcRenderer.send("print-receipt", html)
    });
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("dialogApi", dialogApi);
    contextBridge.exposeInMainWorld("exportApi", exportApi);
    contextBridge.exposeInMainWorld("zoomApi", zoomApi);
    contextBridge.exposeInMainWorld("databaseUpgradeApi", databaseUpgradeApi);
    contextBridge.exposeInMainWorld("env", {
      API_URL: `http://localhost:${apiPort}`
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in ts)
  window.productsApi = productsApi;
  // @ts-ignore (define in ts)
  window.dialogApi = dialogApi;
  // @ts-ignore (define in ts)
  window.exportApi = exportApi;
  // @ts-ignore (define in ts)
  window.zoomApi = zoomApi;
  // @ts-ignore (define in ts)
  window.databaseUpgradeApi = databaseUpgradeApi;
  // @ts-ignore (define in ts)
  window.env = { API_URL: `http://localhost:${apiPort}` };
}
