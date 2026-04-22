import { contextBridge, ipcRenderer } from "electron";
import type { ProductsApi, ShareApi, TransactionType } from "../shared/types";

const shareApi: ShareApi = {
  saveAsPDF: (transactionId: string, type: TransactionType) =>
    ipcRenderer.invoke("shareApi:saveAsPDF", transactionId, type)
};

const productsApi: ProductsApi = {
  saveProductImage: (dataUrl: string) => ipcRenderer.invoke("products:saveProductImage", dataUrl)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      printReceipt: (html: string) => ipcRenderer.send("print-receipt", html)
    });
    contextBridge.exposeInMainWorld("shareApi", shareApi);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
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
}
