import type {
  CustomersApi,
  DashboardApi,
  EstimatesApi,
  SalesApi,
  ShareApi
} from "src/shared/types";

declare global {
  interface Window {
    dashboardApi: DashboardApi;
    salesApi: SalesApi;
    estimatesApi: EstimatesApi;
    customersApi: CustomersApi;
    shareApi: ShareApi;
  }
}
