import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import type { DatabaseUpgradeStatus } from "../../shared/types";
import { getFallbackDbPath } from "../utils/fallbackDbPath";
import * as schema from "./schema";
import { coordinateDatabaseUpgrade } from "./upgradeCoordinator";

export let db: BetterSQLite3Database<typeof schema>;
let initialization: Promise<typeof db> | undefined;

export type InitDbOptions = {
  onStatus?: (status: DatabaseUpgradeStatus) => void;
};

export function getDatabasePath(): string {
  return process.env.M_VITE_DATABASE_URL || getFallbackDbPath();
}

export function getMigrationsFolder(): string {
  const migrationsFolder = process.env.M_VITE_MIGRATION_FOLDER;
  if (migrationsFolder) return migrationsFolder;
  if (process.env.M_VITE_IS_PACKAGED === "true") {
    throw new Error("Database migration resources were not configured.");
  }
  return path.resolve(process.cwd(), "drizzle");
}

export async function initDb(options: InitDbOptions = {}) {
  if (db) return db;
  if (initialization) return initialization;

  initialization = coordinateDatabaseUpgrade({
    databasePath: getDatabasePath(),
    migrationsFolder: getMigrationsFolder(),
    onStatus: options.onStatus
  })
    .then((result) => {
      db = result.db;
      return db;
    })
    .catch((error) => {
      initialization = undefined;
      throw error;
    });

  return initialization;
}
