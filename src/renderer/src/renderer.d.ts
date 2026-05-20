import type { DialogApi, ProductsApi, ShareApi } from "src/shared/types";

declare global {
  interface Window {
    shareApi: ShareApi;
    productsApi: ProductsApi;
    dialogApi: DialogApi;
  }
}
