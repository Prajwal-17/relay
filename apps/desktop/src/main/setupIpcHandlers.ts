import { dialogHandlers } from "./ipcHandlers/dialogHandlers";
import { exportHandlers } from "./ipcHandlers/exportHandlers";
import { productHandlers } from "./ipcHandlers/productHandlers";
import { zoomHandlers } from "./ipcHandlers/zoomHandlers";

export function setupIpcHandlers() {
  productHandlers();
  dialogHandlers();
  exportHandlers();
  zoomHandlers();
}
