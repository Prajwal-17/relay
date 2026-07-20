import { contextBridge, ipcRenderer } from "electron";
import type { DialogApi, ExportApi, ProductsApi, TransactionType, ZoomApi } from "../shared/types";

const productsApi: ProductsApi = {
  saveProductImage: (dataUrl: string) => ipcRenderer.invoke("products:saveProductImage", dataUrl)
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
  window.env = { API_URL: `http://localhost:${apiPort}` };
}
