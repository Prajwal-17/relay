import type { CustomersApi, EstimatesApi, ProductsApi, SalesApi, ShareApi } from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    salesApi: SalesApi;
    estimatesApi: EstimatesApi;
    customersApi: CustomersApi;
    shareApi: ShareApi;
  }
}
