import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as schema from "../../db/schema";
import {
  customerLedger,
  customers,
  estimateItems,
  estimates,
  productHistory,
  products,
  saleItems,
  sales
} from "../../db/schema";

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

export function cleanupDb(db: DB) {
  db.delete(estimateItems).run();
  db.delete(saleItems).run();
  db.delete(estimates).run();
  db.delete(customerLedger).run();
  db.delete(sales).run();
  db.delete(productHistory).run();
  db.delete(products).run();
  db.delete(customers).run();
}
