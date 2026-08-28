import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as schema from "../../db/schema";

export type DB = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

export type TestDb = {
  sqlite: Database.Database;
  db: DB;
};

export function createTestDb(): TestDb {
  process.env.M_VITE_MIGRATION_FOLDER ??= "drizzle";

  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.resolve(process.cwd(), process.env.M_VITE_MIGRATION_FOLDER);
  migrate(db, { migrationsFolder });
  sqlite.pragma("foreign_keys = ON");

  return { sqlite, db: db as DB };
}
