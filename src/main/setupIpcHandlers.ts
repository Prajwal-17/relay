import customersHandlers from "./ipcHandlers/customersHandlers";
import { estimatesHandlers } from "./ipcHandlers/estimatesHandlers";
import { productHandlers } from "./ipcHandlers/productsHandlers";
import { salesHandlers } from "./ipcHandlers/salesHandlers";

export function setupIpcHandlers() {
  productHandlers();
  salesHandlers();
  estimatesHandlers();
  customersHandlers();
}
