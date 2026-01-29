import { dashboardHandlers } from "./ipcHandlers/dashboardHandlers";
import { shareHandlers } from "./ipcHandlers/shareHandlers";

export function setupIpcHandlers() {
  dashboardHandlers();
  shareHandlers();
}
