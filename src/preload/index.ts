import { contextBridge, ipcRenderer } from "electron";
import type {
  CustomersApi,
  CustomersType,
  DateRangeType,
  EstimatePayload,
  EstimatesApi,
  FilteredGoogleContactsType,
  ProductsApi,
  SalePayload,
  SalesApi,
  ShareApi
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
  getTransactionById: (id: string) => ipcRenderer.invoke("salesApi:getTransactionById", id),
  getSalesDateRange: (range: DateRangeType) =>
    ipcRenderer.invoke("salesApi:getSalesDateRange", range),
  deleteSale: (saleId: string) => ipcRenderer.invoke("salesApi:deleteSale", saleId),
  convertSaletoEstimate: (saleId: string) =>
    ipcRenderer.invoke("salesApi:convertSaletoEstimate", saleId)
};

const estimatesApi: EstimatesApi = {
  getNextEstimateNo: () => ipcRenderer.invoke("estimatesApi:getNextEstimateNo"),
  save: (payload: EstimatePayload) => ipcRenderer.invoke("estimatesApi:save", payload),
  getAllEstimates: () => ipcRenderer.invoke("estimatesApi:getAllEstimates"),
  getTransactionById: (id: string) => ipcRenderer.invoke("estimatesApi:getTransactionById", id),
  getEstimatesDateRange: (range: DateRangeType) =>
    ipcRenderer.invoke("estimatesApi:getEstimatesDateRange", range),
  deleteEstimate: (estimateId: string) =>
    ipcRenderer.invoke("estimatesApi:deleteEstimate", estimateId),
  convertEstimateToSale: (estimateId: string) =>
    ipcRenderer.invoke("estimatesApi:convertEstimateToSale", estimateId)
};

const customersApi: CustomersApi = {
  addNewCustomer: (payload: CustomersType) =>
    ipcRenderer.invoke("customersApi:addNewCustomer", payload),
  updateCustomer: (payload: CustomersType) =>
    ipcRenderer.invoke("customersApi:updateCustomer", payload),
  getCustomerById: (customerId: string) =>
    ipcRenderer.invoke("customersApi:getCustomerById", customerId),
  getCustomerByName: (customerName: string) =>
    ipcRenderer.invoke("customersApi:getCustomerByName", customerName),
  getAllCustomers: () => ipcRenderer.invoke("customersApi:getAllCustomers"),
  getAllTransactionsById: (customerId: string) =>
    ipcRenderer.invoke("customersApi:getAllTransactionsById", customerId),
  deleteCustomer: (customerId: string) =>
    ipcRenderer.invoke("customersApi:deleteCustomer", customerId),
  importContactsFromGoogle: () => ipcRenderer.invoke("customers:importContactsFromGoogle"),
  importContacts: (customerPayload: FilteredGoogleContactsType[]) =>
    ipcRenderer.invoke("customersApi:importContacts", customerPayload),
  searchCustomers: (query: string) => ipcRenderer.invoke("customersApi:searchCustomers", query)
};

const shareApi: ShareApi = {
  sendViaWhatsapp: (type: "sales" | "estimates", transactionId: string) =>
    ipcRenderer.invoke("shareApi:sendViaWhatsapp", type, transactionId)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      printReceipt: (html: string) => ipcRenderer.send("print-receipt", html)
    });
    contextBridge.exposeInMainWorld("productsApi", productsApi);
    contextBridge.exposeInMainWorld("salesApi", salesApi);
    contextBridge.exposeInMainWorld("estimatesApi", estimatesApi);
    contextBridge.exposeInMainWorld("customersApi", customersApi);
    contextBridge.exposeInMainWorld("shareApi", shareApi);
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
  // @ts-ignore (define in ts)
  window.shareApi = shareApi;
}
