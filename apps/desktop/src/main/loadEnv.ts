import dotenv from "dotenv";
import { app } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

export function initMainEnv() {
  // cross-env sets this for dev/start; packaged builds detect from package.json
  const mode =
    process.env.MODE ??
    (() => {
      try {
        const pkgPath = path.join(app.getAppPath(), "package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        return pkg.name === "quickcart-dev" ? "development" : "production";
      } catch {
        return "production";
      }
    })();

  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${mode}`), override: false });

  process.env.MODE = mode;
  return mode;
}
