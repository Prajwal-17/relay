import { app } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function getAppIconPath(): string | undefined {
  // Packaged dev/prod builds copy their own icon to this shared resource name.
  const suffix = process.env.MODE === "development" ? "-dev" : "";
  const extension = process.platform === "win32" ? "ico" : "png";
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, "relay-icon.png")
    : join(app.getAppPath(), `../../assets/desktop/icon${suffix}.${extension}`);
  return existsSync(iconPath) ? iconPath : undefined;
}
