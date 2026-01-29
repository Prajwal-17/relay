import type { ShareApi } from "src/shared/types";

declare global {
  interface Window {
    shareApi: ShareApi;
  }
}
