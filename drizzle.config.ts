import { defineConfig } from "drizzle-kit";
import os from "os";
import path from "path";

const homedir = os.homedir();
let dbUrl: string;

if (process.platform === "linux") {
  dbUrl = path.join(homedir, ".config", "QuickCart", "pos.db");
} else if (process.platform === "win32") {
  dbUrl = path.join(homedir, "AppData", "Roaming", "QuickCart", "pos.db");
} else {
  throw new Error("Unsupported platform");
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbUrl
  }
});
