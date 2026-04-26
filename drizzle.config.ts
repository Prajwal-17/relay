import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

const mode = process.env.MODE || "development";
const envFile = `.env.${mode}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.M_VITE_DATABASE_URL!
  }
});
