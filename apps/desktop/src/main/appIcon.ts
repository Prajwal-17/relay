import { app } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

const iconFileName = "relay-icon.png";

export function getLinuxAppIconPath(): string | undefined {
  if (process.platform !== "linux") return undefined;

  const iconPath = app.isPackaged
    ? join(process.resourcesPath, iconFileName)
    : join(app.getAppPath(), "../../assets/desktop/icon.png");

  return existsSync(iconPath) ? iconPath : undefined;
}
