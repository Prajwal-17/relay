import { dialogHandlers } from "./ipcHandlers/dialogHandlers";
import { exportHandlers } from "./ipcHandlers/exportHandlers";
import { productHandlers } from "./ipcHandlers/productHandlers";

export function setupIpcHandlers() {
  productHandlers();
  dialogHandlers();
  exportHandlers();
}
