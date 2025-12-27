import type { DashboardApi, ShareApi } from "src/shared/types";

declare global {
  interface Window {
    dashboardApi: DashboardApi;
    shareApi: ShareApi;
  }
}
