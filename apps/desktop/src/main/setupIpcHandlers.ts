import { dialogHandlers } from "./ipcHandlers/dialogHandlers";
import { exportHandlers } from "./ipcHandlers/exportHandlers";
import { productHandlers } from "./ipcHandlers/productHandlers";
import { printHandlers } from "./ipcHandlers/printHandlers";
import { zoomHandlers } from "./ipcHandlers/zoomHandlers";

export function setupIpcHandlers() {
  productHandlers();
  printHandlers();
  dialogHandlers();
  exportHandlers();
  zoomHandlers();
}
