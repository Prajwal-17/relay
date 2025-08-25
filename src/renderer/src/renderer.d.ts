import type { EstimatesApi, ProductsApi, SalesApi } from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    salesApi: SalesApi;
    estimatesApi: EstimatesApi;
  }
}
