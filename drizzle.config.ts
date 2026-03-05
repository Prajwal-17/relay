import { defineConfig } from "drizzle-kit";
import { app } from "electron";
import path from "path";

let dbUrl: string;

if (process.platform === "linux") {
  dbUrl = path.join(app.getPath("userData"), "pos.db");
} else if (process.platform === "win32") {
  dbUrl = path.join(app.getPath("userData"), "pos.db");
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
