import os from "node:os";
import path from "node:path";

// fallback path for standalone scripts - which dont require electron
export function getFallbackDbPath() {
  const mode = process.env.MODE || process.env.NODE_ENV || "development";
  const appName = mode === "development" ? "Relay-Dev" : "Relay";
  const homeDir = os.homedir();

  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      appName,
      "relay.db"
    );
  }

  // linux
  return path.join(homeDir, ".config", appName, "relay.db");
}
