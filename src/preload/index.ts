import { contextBridge, ipcRenderer } from "electron";
import type {
  CustomersApi,
  CustomersType,
  DashboardApi,
  DateRangeType,
  EstimatePayload,
  EstimatesApi,
  FilteredGoogleContactsType,
  PageNo,
  ProductsApi,
  SalePayload,
  SalesApi,
  ShareApi,
  SortType,
  TransactionType
} from "../shared/types";

const dashboardApi: DashboardApi = {
  getMetricsSummary: () => ipcRenderer.invoke("dashboardApi:getMetricsSummary"),
  getChartMetrics: (timePeriod) => ipcRenderer.invoke("dashboardApi:getChartMetrics", timePeriod),
  getRecentTransactions: (type) => ipcRenderer.invoke("dashboardApi:getRecentTransactions", type),
  getTopProducts: () => ipcRenderer.invoke("dashboardApi:getTopProducts")
};

const productsApi: ProductsApi = {
  getAllProducts: () => ipcRenderer.invoke("productsApi:getAllProducts"),
  search: (query, pageNo, limit, filterType) =>
    ipcRenderer.invoke("productsApi:search", query, pageNo, limit, filterType),
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
  getSalesDateRange: (range: DateRangeType, sortBy: SortType, pageNo: PageNo) =>
    ipcRenderer.invoke("salesApi:getSalesDateRange", range, sortBy, pageNo),
  deleteSale: (saleId: string) => ipcRenderer.invoke("salesApi:deleteSale", saleId),
  convertSaletoEstimate: (saleId: string) =>
    ipcRenderer.invoke("salesApi:convertSaletoEstimate", saleId),
  registerSaleItemQty: (saleItemId, action) =>
    ipcRenderer.invoke("salesApi:updateCheckedQuantity", saleItemId, action)
};

const estimatesApi: EstimatesApi = {
  getNextEstimateNo: () => ipcRenderer.invoke("estimatesApi:getNextEstimateNo"),
  save: (payload: EstimatePayload) => ipcRenderer.invoke("estimatesApi:save", payload),
  getAllEstimates: () => ipcRenderer.invoke("estimatesApi:getAllEstimates"),
  getTransactionById: (id: string) => ipcRenderer.invoke("estimatesApi:getTransactionById", id),
  getEstimatesDateRange: (range: DateRangeType, sortBy: SortType, pageNo: PageNo) =>
    ipcRenderer.invoke("estimatesApi:getEstimatesDateRange", range, sortBy, pageNo),
  deleteEstimate: (estimateId: string) =>
    ipcRenderer.invoke("estimatesApi:deleteEstimate", estimateId),
  convertEstimateToSale: (estimateId: string) =>
    ipcRenderer.invoke("estimatesApi:convertEstimateToSale", estimateId),
  registerEstimateItemQty: (estimateItemId, action) =>
    ipcRenderer.invoke("estimatesApi:updateCheckedQuantity", estimateItemId, action)
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
  getAllTransactionsById: (customerId: string, type: TransactionType, pageNo: PageNo) =>
    ipcRenderer.invoke("customersApi:getAllTransactionsById", customerId, type, pageNo),
  deleteCustomer: (customerId: string) =>
    ipcRenderer.invoke("customersApi:deleteCustomer", customerId),
  importContactsFromGoogle: () => ipcRenderer.invoke("customers:importContactsFromGoogle"),
  importContacts: (customerPayload: FilteredGoogleContactsType[]) =>
    ipcRenderer.invoke("customersApi:importContacts", customerPayload),
  searchCustomers: (query: string) => ipcRenderer.invoke("customersApi:searchCustomers", query)
};

const shareApi: ShareApi = {
  saveAsPDF: (transactionId: string, type: "sales" | "estimates") =>
    ipcRenderer.invoke("shareApi:saveAsPDF", transactionId, type)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      printReceipt: (html: string) => ipcRenderer.send("print-receipt", html)
    });
    contextBridge.exposeInMainWorld("dashboardApi", dashboardApi);
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
  window.dashboardApi = dashboardApi;
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
