import { randomUUID } from "node:crypto";
import type { AppConfig } from "../../../../shared/types";
import type { DataMigration } from "../types";

const STORE_ID = "default";
const DEFAULT_CUSTOMER_NAME = "DEFAULT";

// Keeps saved preferences and fills in settings added in this version.
function buildCurrentConfig(
  defaults: AppConfig,
  existing: Partial<AppConfig> | undefined,
  defaultCustomerId: string
): AppConfig {
  return {
    billing: {
      ...defaults.billing,
      ...existing?.billing,
      defaultCustomerId: existing?.billing?.defaultCustomerId || defaultCustomerId,
      searchDropdown: {
        ...defaults.billing.searchDropdown,
        ...existing?.billing?.searchDropdown
      }
    },
    exports: {
      ...defaults.exports,
      ...existing?.exports
    }
  };
}

export const createLegacyDefaults: DataMigration = {
  id: "v4.3.0:create-legacy-defaults",
  label: "Preparing legacy store records",
  // Adds the basic store, customer, and preferences that old databases are missing.
  run({ sqlite, isLegacyDatabase, defaultConfig, platform }) {
    if (!isLegacyDatabase) return;

    sqlite.prepare("DELETE FROM customer_ledger").run();
    sqlite.prepare("UPDATE customers SET outstanding_balance = 0").run();

    sqlite
      .prepare(
        `INSERT OR IGNORE INTO app_instance (id, os, installed_at)
         VALUES (?, ?, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      )
      .run(STORE_ID, platform);

    sqlite
      .prepare(
        `INSERT OR IGNORE INTO store_profile (
           id, store_name, owner_name, phone, email, address_line1,
           country, state, pincode, city
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        STORE_ID,
        "My Store",
        "Store Owner",
        "0000000000",
        "owner@example.com",
        "Default Address",
        "IN",
        "Maharashtra",
        "400001",
        "Mumbai"
      );

    const existingDefault = sqlite
      .prepare("SELECT id FROM customers WHERE name = ? LIMIT 1")
      .get(DEFAULT_CUSTOMER_NAME) as { id: string } | undefined;
    const defaultCustomerId = existingDefault?.id ?? randomUUID();

    if (!existingDefault) {
      sqlite
        .prepare(
          `INSERT INTO customers (id, store_id, name, customer_type)
           VALUES (?, ?, ?, ?)`
        )
        .run(defaultCustomerId, STORE_ID, DEFAULT_CUSTOMER_NAME, "cash");
    }

    const preferences = sqlite.prepare("SELECT id, config FROM app_preferences WHERE store_id IS NULL OR store_id = 'default'").all() as {
      id: string;
      config: string;
    }[];
    if (preferences.length === 0) {
      sqlite
        .prepare("INSERT INTO app_preferences (id, store_id, config) VALUES (?, ?, ?)")
        .run(
          randomUUID(),
          STORE_ID,
          JSON.stringify(buildCurrentConfig(defaultConfig, undefined, defaultCustomerId))
        );
    } else {
      const update = sqlite.prepare("UPDATE app_preferences SET config = ? WHERE id = ?");
      for (const preference of preferences) {
        const existing = JSON.parse(preference.config) as Partial<AppConfig>;
        update.run(
          JSON.stringify(buildCurrentConfig(defaultConfig, existing, defaultCustomerId)),
          preference.id
        );
      }
    }
  }
};
