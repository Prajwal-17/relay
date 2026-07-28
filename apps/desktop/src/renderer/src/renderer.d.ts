import type {
  DatabaseUpgradeApi,
  DialogApi,
  ExportApi,
  ProductsApi,
  ZoomApi
} from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    dialogApi: DialogApi;
    exportApi: ExportApi;
    zoomApi: ZoomApi;
    databaseUpgradeApi: DatabaseUpgradeApi;
    env: {
      API_URL: string;
    };
  }
}
