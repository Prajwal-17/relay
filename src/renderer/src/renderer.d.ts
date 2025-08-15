import type { ElectronAPI } from "@electron-toolkit/preload";
import type { EstimatesApi, ProductsApi, SalesApi } from "src/shared/types";

declare global {
  interface Window {
    electron: ElectronAPI;
    productsApi: ProductsApi;
    salesApi: SalesApi;
    estimatesApi: EstimatesApi;
  }
}
