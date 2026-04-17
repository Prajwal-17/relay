import { productHandlers } from "./ipcHandlers/productHandlers";
import { shareHandlers } from "./ipcHandlers/shareHandlers";

export function setupIpcHandlers() {
  shareHandlers();
  productHandlers();
}
