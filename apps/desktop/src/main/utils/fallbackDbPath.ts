import os from "node:os";
import path from "node:path";

// fallback path for standalone scripts - which dont require electron
export function getFallbackDbPath() {
  const mode = process.env.MODE || process.env.NODE_ENV || "development";
  const appName = mode === "development" ? "QuickCart-Dev" : "QuickCart";
  const homeDir = os.homedir();

  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      appName,
      "pos.db"
    );
  }

  // linux
  return path.join(homeDir, ".config", appName, "pos.db");
}
