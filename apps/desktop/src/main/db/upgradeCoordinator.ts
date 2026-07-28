import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import type { AppConfig, DatabaseUpgradeStatus } from "../../shared/types";
import { getDefaultConfig } from "../modules/preferences/preferences.defaults";
import { createLatestBackup, getBackupPaths } from "./backup";
import { dataMigrationRegistry } from "./dataMigrations/registry";
import { getPendingDataMigrations, runDataMigrations } from "./dataMigrations/runner";
import type { DataMigrationContext } from "./dataMigrations/types";
import * as schema from "./schema";
import {
  adoptPrereleaseSchema,
  captureUpgradeBaseline,
  createUpgradeStatus,
  inspectDatabaseUpgrade,
  verifyDatabaseUpgrade,
  type UpgradeInspection
} from "./upgradeCoordinator.utils";

export {
  captureUpgradeBaseline,
  inspectDatabaseUpgrade,
  verifyDatabaseUpgrade
} from "./upgradeCoordinator.utils";
export type { UpgradeInspection } from "./upgradeCoordinator.utils";

export type UpgradeDatabase = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

export type UpgradeCoordinatorOptions = {
  databasePath: string;
  migrationsFolder: string;
  onStatus?: (status: DatabaseUpgradeStatus) => void;
};

export type UpgradeCoordinatorResult = {
  db: UpgradeDatabase;
  sqlite: Database.Database;
  inspection: UpgradeInspection;
  backupAvailable: boolean;
};

export async function coordinateDatabaseUpgrade(
  options: UpgradeCoordinatorOptions
): Promise<UpgradeCoordinatorResult> {
  const { databasePath, migrationsFolder, onStatus } = options;
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Database migration resources are missing: ${migrationsFolder}`);
  }

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const inspection = inspectDatabaseUpgrade(databasePath, migrationsFolder);
  const sqlite = new Database(databasePath);
  const baseline = inspection.required
    ? captureUpgradeBaseline(
        sqlite,
        inspection.pendingDataMigrationIds.includes("v4.3.0:create-legacy-defaults")
      )
    : undefined;
  let backupAvailable = fs.existsSync(getBackupPaths(databasePath).latest);
  let currentStep = 0;

  try {
    const database = drizzle(sqlite, { schema, logger: false }) as UpgradeDatabase;

    if (inspection.needsBackup) {
      currentStep += 1;
      console.info("Database upgrade: creating backup");
      onStatus?.(
        createUpgradeStatus(
          inspection,
          "backing_up",
          "Creating a safe backup",
          currentStep,
          backupAvailable
        )
      );
      await createLatestBackup(sqlite, databasePath, inspection.upgradeKey);
      backupAvailable = true;
    }

    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    if (inspection.schemaPending) {
      currentStep += 1;
      console.info("Database upgrade: applying schema migrations");
      onStatus?.(
        createUpgradeStatus(
          inspection,
          "schema",
          "Updating the database structure",
          currentStep,
          backupAvailable
        )
      );
      if (inspection.adoptPrereleaseSchema) {
        adoptPrereleaseSchema(sqlite, migrationsFolder);
      } else {
        migrate(database, { migrationsFolder });
      }
    }

    const defaultConfig: AppConfig = getDefaultConfig();
    const context: DataMigrationContext = {
      sqlite,
      isLegacyDatabase: !inspection.isFreshDatabase,
      defaultConfig,
      platform: process.platform
    };
    const pending = getPendingDataMigrations(context, dataMigrationRegistry);
    runDataMigrations(context, pending, ({ label }) => {
      currentStep += 1;
      console.info(`Database upgrade: data step ${currentStep}`);
      onStatus?.(createUpgradeStatus(inspection, "data", label, currentStep, backupAvailable));
    });

    if (inspection.required) {
      currentStep += 1;
      console.info("Database upgrade: verifying database");
      onStatus?.(
        createUpgradeStatus(
          inspection,
          "verifying",
          "Checking upgraded records",
          currentStep,
          backupAvailable
        )
      );
      verifyDatabaseUpgrade(sqlite, baseline!);
    }

    return { db: database, sqlite, inspection, backupAvailable };
  } catch (error) {
    sqlite.close();
    throw error;
  }
}
