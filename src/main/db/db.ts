import Database from "better-sqlite3";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

dotenv.config();

function getDbPath() {
  if (process.env.DATABASE_URL) {
    console.log(process.env.DATABASE_URL);
    return process.env.DATABASE_URL;
  }

  return path.join(app.getPath("userData"), "pos.db");
}

function getMigrationsFolder() {
  if (process.env.MIGRATION_FOLDER) {
    return path.join(process.cwd(), process.env.MIGRATION_FOLDER);
  }

  return app.isPackaged
    ? path.join(process.resourcesPath, "drizzle")
    : path.join(__dirname, "../../drizzle");
}

const dbPath = getDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

// sqlite.pragma("foreign_keys = OFF");
export const db = drizzle(sqlite, { schema, logger: false });

const migrationsFolder = getMigrationsFolder();

if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
  // sqlite.pragma("foreign_keys = ON");
} else {
  console.error("Migration folder not found");
}
