import type { DialogApi, ExportApi, ProductsApi } from "src/shared/types";

declare global {
  interface Window {
    productsApi: ProductsApi;
    dialogApi: DialogApi;
    exportApi: ExportApi;
    env: {
      API_URL: string;
    };
  }
}
