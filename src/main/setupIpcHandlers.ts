import { productHandlers } from "./ipcHandlers/productsHandlers";
import { salesHandlers } from "./ipcHandlers/salesHandlers";
import { estimatesHandlers } from "./ipcHandlers/estimatesHandlers";

export function setupIpcHandlers() {
  productHandlers();
  salesHandlers();
  estimatesHandlers();
}
