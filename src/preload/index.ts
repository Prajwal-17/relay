import { contextBridge, ipcRenderer } from "electron";
import type { DashboardApi, ShareApi } from "../shared/types";

const dashboardApi: DashboardApi = {
  getMetricsSummary: () => ipcRenderer.invoke("dashboardApi:getMetricsSummary"),
  getChartMetrics: (timePeriod) => ipcRenderer.invoke("dashboardApi:getChartMetrics", timePeriod),
  getRecentTransactions: (type) => ipcRenderer.invoke("dashboardApi:getRecentTransactions", type),
  getTopProducts: () => ipcRenderer.invoke("dashboardApi:getTopProducts")
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
    contextBridge.exposeInMainWorld("shareApi", shareApi);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.dashboardApi = dashboardApi;
  // @ts-ignore (define in ts)
  window.shareApi = shareApi;
}
