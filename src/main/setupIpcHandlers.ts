import { shareHandlers } from "./ipcHandlers/shareHandlers";

export function setupIpcHandlers() {
  shareHandlers();
}
