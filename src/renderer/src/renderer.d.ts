import type {
  CustomersApi,
  DashboardApi,
  EstimatesApi,
  ProductsApi,
  SalesApi,
  ShareApi
} from "src/shared/types";

declare global {
  interface Window {
    dashboardApi: DashboardApi;
    productsApi: ProductsApi;
    salesApi: SalesApi;
    estimatesApi: EstimatesApi;
    customersApi: CustomersApi;
    shareApi: ShareApi;
  }
}
