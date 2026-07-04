import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { getFallbackDbPath } from "../utils/fallbackDbPath";
import * as schema from "./schema";

export let db: BetterSQLite3Database<typeof schema>;

export async function initDb() {
  if (db) return db;

  async function getDbPath() {
    return process.env.M_VITE_DATABASE_URL || getFallbackDbPath();
  }

  async function getMigrationsFolder() {
    return process.env.M_VITE_MIGRATION_FOLDER!;
  }

  const dbPath = await getDbPath();
  fs.mkdirSync(path.dirname(dbPath!), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  db = drizzle(sqlite, { schema, logger: false });

  const migrationsFolder = await getMigrationsFolder();
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  } else {
    console.error("Migration folder not found");
  }

  return db;
}
