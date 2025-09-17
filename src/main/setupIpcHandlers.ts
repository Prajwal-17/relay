import { customerHandlers } from "./ipcHandlers/customerHandlers";
import { estimateHandlers } from "./ipcHandlers/estimateHandlers";
import { productHandlers } from "./ipcHandlers/productHandlers";
import { saleHandlers } from "./ipcHandlers/saleHandlers";
import { shareHandlers } from "./ipcHandlers/shareHandlers";

export function setupIpcHandlers() {
  productHandlers();
  saleHandlers();
  estimateHandlers();
  customerHandlers();
  shareHandlers();
}
