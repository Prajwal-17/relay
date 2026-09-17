import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { ledgerV1 } from "./migrations/money-migrations";

const DATABASE_VERSION = 1;

export async function withLedgerTransaction(
  db: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>
): Promise<void> {
  if (Platform.OS === "web") await db.withTransactionAsync(() => task(db));
  else await db.withExclusiveTransactionAsync(task);
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const currentVersion =
    (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error("This database was created by a newer version of Relay.");
  }

  if (currentVersion < 1) {
    await withLedgerTransaction(db, async (transaction) => {
      await transaction.execAsync(ledgerV1);
      await transaction.execAsync("PRAGMA user_version = 1;");
    });
  }
}
