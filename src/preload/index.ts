import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import type {
  CustomersApi,
  CustomersType,
  EstimatePayload,
  EstimatesApi,
  FilteredGoogleContactsType,
  ProductsApi,
  SalePayload,
  SalesApi
} from "../shared/types";

const productsApi: ProductsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query, page, limit) => ipcRenderer.invoke("productsApi:search", query, page, limit),
  addNewProduct: (payload) => ipcRenderer.invoke("productsApi:addNewProduct", payload),
  updateProduct: (payload, productId) =>
    ipcRenderer.invoke("productsApi:updateProduct", payload, productId),
  deleteProduct: (productId) => ipcRenderer.invoke("productsApi:deleteProduct", productId)
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

const customersApi: CustomersApi = {
  addNewCustomer: (payload: CustomersType) =>
    ipcRenderer.invoke("customersApi:addNewCustomer", payload),
  updateCustomer: (payload: CustomersType) =>
    ipcRenderer.invoke("customersApi:updateCustomer", payload),
  getAllCustomers: () => ipcRenderer.invoke("customersApi:getAllCustomers"),
  deleteCustomer: (customerId: string) =>
    ipcRenderer.invoke("customersApi:deleteCustomer", customerId),
  importContactsFromGoogle: () => ipcRenderer.invoke("customers:importContactsFromGoogle"),
  importContacts: (customerPayload: FilteredGoogleContactsType[]) =>
    ipcRenderer.invoke("customersApi:importContacts", customerPayload)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI);
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("salesApi", salesApi);
    contextBridge.exposeInMainWorld("estimatesApi", estimatesApi);
    contextBridge.exposeInMainWorld("customersApi", customersApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.productsApi = productsApi;
  // @ts-ignore (define in dts)
  window.salesApi = salesApi;
  // @ts-ignore (define in dts)
  window.estimatesApi = estimatesApi;
  // @ts-ignore (define in dts)
  window.customersApi = customersApi;
}
