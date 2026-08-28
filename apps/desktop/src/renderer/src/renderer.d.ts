import type {
  DatabaseUpgradeApi,
  DialogApi,
  ExportApi,
  ProductsApi,
  RawPrintApi,
  ZoomApi
} from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    dialogApi: DialogApi;
    exportApi: ExportApi;
    rawPrintApi: RawPrintApi;
    zoomApi: ZoomApi;
    databaseUpgradeApi: DatabaseUpgradeApi;
    env: {
      API_URL: string;
      API_TOKEN: string;
    };
  }
}
