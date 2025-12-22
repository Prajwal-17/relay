import { dashboardHandlers } from "./ipcHandlers/dashboardHandlers";
import { estimateHandlers } from "./ipcHandlers/estimateHandlers";
import { saleHandlers } from "./ipcHandlers/saleHandlers";
import { shareHandlers } from "./ipcHandlers/shareHandlers";

export function setupIpcHandlers() {
  dashboardHandlers();
  saleHandlers();
  estimateHandlers();
  shareHandlers();
}
