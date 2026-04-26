import dotenv from "dotenv";
import path from "node:path";

export function initMainEnv(isPackaged?: boolean) {
  const mode = process.env.MODE ?? (isPackaged ? "production" : "development");

  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${mode}`), override: false });

  process.env.MODE = mode;
  return mode;
}
