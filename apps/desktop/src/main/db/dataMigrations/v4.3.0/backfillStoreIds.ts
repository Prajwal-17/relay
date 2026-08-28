import type { DataMigration } from "../types";

export const backfillStoreIds: DataMigration = {
  id: "v4.3.0:backfill-store-ids",
  label: "Linking records to the store",
  // Links old records to the default store when their store ID is missing.
  run({ sqlite, isLegacyDatabase }) {
    if (!isLegacyDatabase) return;

    const defaultStoreExists = sqlite
      .prepare("SELECT 1 FROM store_profile WHERE id = 'default'")
      .get();
    if (!defaultStoreExists) throw new Error("The legacy store profile could not be created.");

    for (const table of ["customers", "products", "sales", "estimates", "app_preferences"]) {
      sqlite.prepare(`UPDATE ${table} SET store_id = 'default' WHERE store_id IS NULL`).run();
    }
  }
};
