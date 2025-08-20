import { contextBridge, ipcRenderer } from "electron";
import type {
  EstimatePayload,
  EstimatesApi,
  ProductsApi,
  SalePayload,
  SalesApi
} from "../shared/types";

const productsApi: ProductsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query, page, limit) => ipcRenderer.invoke("productsApi:search", query, page, limit)
};

const salesApi: SalesApi = {
  getNextInvoiceNo: () => ipcRenderer.invoke("salesApi:getNextInvoiceNo"),
  save: (payload: SalePayload) => ipcRenderer.invoke("salesApi:save", payload),
  getAllSales: () => ipcRenderer.invoke("salesApi:getAllSales"),
  getTransactionById: (id: string) => ipcRenderer.invoke("salesApi:getTransactionById", id)
};
const estimatesApi: EstimatesApi = {
  getNextEstimateNo: () => ipcRenderer.invoke("estimatesApi:getNextEstimateNo"),
  save: (payload: EstimatePayload) => ipcRenderer.invoke("estimatesApi:save", payload),
  getAllEstimates: () => ipcRenderer.invoke("estimatesApi:getAllEstimates"),
  getTransactionById: (id: string) => ipcRenderer.invoke("estimatesApi:getTransactionById", id)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("salesApi", salesApi);
    contextBridge.exposeInMainWorld("estimatesApi", estimatesApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.productsApi = productsApi;
  // @ts-ignore (define in dts)
  window.salesApi = salesApi;
  // @ts-ignore (define in dts)
  window.estimatesApi = estimatesApi;
}
