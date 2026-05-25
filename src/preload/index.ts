import { contextBridge, ipcRenderer } from "electron";
import type { DialogApi, ProductsApi, ShareApi, TransactionType } from "../shared/types";

const shareApi: ShareApi = {
  saveAsPDF: (transactionId: string, type: TransactionType) =>
    ipcRenderer.invoke("shareApi:saveAsPDF", transactionId, type)
};

const productsApi: ProductsApi = {
  saveProductImage: (dataUrl: string) => ipcRenderer.invoke("products:saveProductImage", dataUrl)
};

const dialogApi: DialogApi = {
  selectFolder: () => ipcRenderer.invoke("dialog:selectFolder")
};

const apiArg = process.argv.find((a) => a.startsWith("--api-port="));
const apiPort = apiArg ? Number(apiArg.split("=")[1]) : 4722;

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      printReceipt: (html: string) => ipcRenderer.send("print-receipt", html)
    });
    contextBridge.exposeInMainWorld("shareApi", shareApi);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("dialogApi", dialogApi);
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
  window.shareApi = shareApi;
  // @ts-ignore (define in ts)
  window.productsApi = productsApi;
  // @ts-ignore (define in ts)
  window.dialogApi = dialogApi;
  // @ts-ignore (define in ts)
  window.env = { API_URL: `http://localhost:${apiPort}` };
}
