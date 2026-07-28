import Database from "better-sqlite3";
import { readMigrationFiles } from "drizzle-orm/migrator";
import fs from "node:fs";
import type { DatabaseUpgradeStatus } from "../../shared/types";
import { getBackupPaths, hasBackupForUpgrade } from "./backup";
import { dataMigrationRegistry } from "./dataMigrations/registry";
import {
  PRESERVED_TABLES,
  type PreservedRowCounts,
  type PurchasePriceBaseline,
  type UpgradeBaseline
} from "./dataMigrations/types";

export type UpgradeInspection = {
  required: boolean;
  isFreshDatabase: boolean;
  needsBackup: boolean;
  schemaPending: boolean;
  adoptPrereleaseSchema: boolean;
  pendingDataMigrationIds: string[];
  totalSteps: number;
  backupDirectory: string;
  upgradeKey: string;
};

const LEGACY_CONTENT_TABLES = [
  "app_instance",
  "store_profile",
  "app_preferences",
  "customers",
  "products",
  "product_history",
  "sales",
  "sale_items",
  "estimates",
  "estimate_items"
] as const;

/** Checks if this table is already in the database. */
function tableExists(sqlite: Database.Database, table: string): boolean {
  return Boolean(
    sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );
}

/** Checks if a table already has this column. */
function columnExists(sqlite: Database.Database, table: string, column: string): boolean {
  if (!tableExists(sqlite, table)) return false;
  const columns = sqlite.pragma(`table_info(${table})`) as { name: string }[];
  return columns.some((entry) => entry.name === column);
}

/** Spots databases that already got the old unreleased 0030 changes. */
function looksLikePrereleaseSchema(sqlite: Database.Database): boolean {
  const expectedColumns = [
    ["customers", "archived_at"],
    ["sales", "recorded_at"],
    ["sale_items", "position"],
    ["estimates", "notes"],
    ["estimate_items", "position"]
  ] as const;

  return (
    tableExists(sqlite, "customer_ledger") &&
    !tableExists(sqlite, "app_data_migrations") &&
    !tableExists(sqlite, "__0030_sales") &&
    expectedColumns.every(([table, column]) => columnExists(sqlite, table, column))
  );
}

/** Gets the current row count, or zero when the table is not there yet. */
function tableCount(sqlite: Database.Database, table: string): number {
  if (!tableExists(sqlite, table)) return 0;
  return (sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number })
    .count;
}

/** Finds the last schema migration already recorded in this database. */
function getLastSchemaMigration(sqlite: Database.Database): number {
  if (!tableExists(sqlite, "__drizzle_migrations")) return 0;
  const row = sqlite
    .prepare("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1")
    .get() as { created_at: number | string } | undefined;
  return row ? Number(row.created_at) : 0;
}

/** Lists the data steps that have not run yet. */
function pendingDataMigrationIds(sqlite: Database.Database): string[] {
  if (!tableExists(sqlite, "app_data_migrations")) {
    return dataMigrationRegistry.map((migration) => migration.id);
  }

  const applied = new Set(
    (sqlite.prepare("SELECT id FROM app_data_migrations").all() as { id: string }[]).map(
      (row) => row.id
    )
  );
  return dataMigrationRegistry
    .filter((migration) => !applied.has(migration.id))
    .map((migration) => migration.id);
}

/** Looks through an open database and works out what upgrade work is left. */
function inspectOpenDatabase(
  sqlite: Database.Database,
  migrationsFolder: string,
  databasePath: string
): UpgradeInspection {
  // readMigrationFiles - drizzle built in func to parse migrations
  const migrations = readMigrationFiles({ migrationsFolder });

  // folderMillis - is the timestamp
  const latestSchemaMigration = migrations.at(-1)?.folderMillis ?? 0;
  const previousSchemaMigration = migrations.at(-2)?.folderMillis ?? 0;

  const databaseSchemaMigration = getLastSchemaMigration(sqlite);

  /**
   * Eg :-
   * previousSchemaMigration = 200  // previous official migration
   * latestSchemaMigration = 300    // newest official migration
   * databaseSchemaMigration = 250  // database has an intermediate prerelease migration
   * The database is between the previous and latest migrations,
   * and its actual tables already look like the latest schema.
   * Therefore, adopt the existing schema instead of running the migration again.
   */
  const adoptPrereleaseSchema =
    databaseSchemaMigration > previousSchemaMigration &&
    databaseSchemaMigration < latestSchemaMigration &&
    looksLikePrereleaseSchema(sqlite);

  const schemaPending = databaseSchemaMigration < latestSchemaMigration;
  const pendingIds = pendingDataMigrationIds(sqlite);
  const upgradeKey =
    String(latestSchemaMigration) +
    ":" +
    dataMigrationRegistry.map((migration) => migration.id).join(",");
  const isFreshDatabase = LEGACY_CONTENT_TABLES.every((table) => tableCount(sqlite, table) === 0);
  const required = schemaPending || pendingIds.length > 0;
  const needsBackup =
    required && !isFreshDatabase && !hasBackupForUpgrade(databasePath, upgradeKey);
  const totalSteps =
    (needsBackup ? 1 : 0) + (schemaPending ? 1 : 0) + pendingIds.length + (required ? 2 : 0);

  return {
    required,
    isFreshDatabase,
    needsBackup,
    schemaPending,
    adoptPrereleaseSchema,
    pendingDataMigrationIds: pendingIds,
    totalSteps,
    backupDirectory: getBackupPaths(databasePath).directory,
    upgradeKey
  };
}

/** Opens the database safely and checks if an upgrade is needed. */
export function inspectDatabaseUpgrade(
  databasePath: string,
  migrationsFolder: string
): UpgradeInspection {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Database migration resources are missing: ${migrationsFolder}`);
  }

  if (!fs.existsSync(databasePath)) {
    const sqlite = new Database(":memory:");
    try {
      return inspectOpenDatabase(sqlite, migrationsFolder, databasePath);
    } finally {
      sqlite.close();
    }
  }

  // create conn to existing one
  const sqlite = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return inspectOpenDatabase(sqlite, migrationsFolder, databasePath);
  } finally {
    sqlite.close();
  }
}

/** Remembers old purchase prices so the upgrade cannot quietly change them. */
function capturePurchasePrices(
  sqlite: Database.Database,
  table: "sale_items" | "estimate_items"
): Map<string, number | null> {
  if (!tableExists(sqlite, table)) return new Map();
  return new Map(
    (
      sqlite.prepare(`SELECT id, purchase_price FROM ${table}`).all() as {
        id: string;
        purchase_price: number | null;
      }[]
    ).map((row) => [row.id, row.purchase_price])
  );
}

/** Takes a small before-upgrade snapshot for the final safety checks. */
export function captureUpgradeBaseline(
  sqlite: Database.Database,
  legacyDefaultsPending = false
): UpgradeBaseline {
  const rowCounts = Object.fromEntries(
    PRESERVED_TABLES.map((table) => [table, tableCount(sqlite, table)])
  ) as PreservedRowCounts;
  const purchasePrices: PurchasePriceBaseline = {
    saleItems: capturePurchasePrices(sqlite, "sale_items"),
    estimateItems: capturePurchasePrices(sqlite, "estimate_items")
  };
  const defaultCustomerExisted = tableExists(sqlite, "customers")
    ? Boolean(sqlite.prepare("SELECT 1 FROM customers WHERE name = ? LIMIT 1").get("DEFAULT"))
    : false;

  return {
    rowCounts,
    purchasePrices,
    defaultCustomerExisted,
    legacyDefaultsPending
  };
}

/** Makes sure old item purchase prices stayed exactly the same. */
function verifyPurchasePrices(
  sqlite: Database.Database,
  table: "sale_items" | "estimate_items",
  expected: Map<string, number | null>
): void {
  const select = sqlite.prepare(`SELECT purchase_price FROM ${table} WHERE id = ?`);
  for (const [id, purchasePrice] of expected) {
    const row = select.get(id) as { purchase_price: number | null } | undefined;
    if (!row || row.purchase_price !== purchasePrice) {
      throw new Error(`Historical purchase prices changed in ${table}.`);
    }
  }
}

/** Checks one column and fails if any value is empty. */
function verifyNoBlankValues(
  sqlite: Database.Database,
  table: string,
  column: string,
  message: string
): void {
  const emptyRow = sqlite
    .prepare(`SELECT 1 FROM ${table} WHERE ${column} IS NULL OR TRIM(${column}) = '' LIMIT 1`)
    .get();

  if (emptyRow) throw new Error(message);
}

/** Checks that item positions start at zero and keep using the normal gap. */
function verifyItemPositions(
  sqlite: Database.Database,
  table: "sale_items" | "estimate_items",
  parentColumn: "sale_id" | "estimate_id"
): void {
  const rows = sqlite
    .prepare(
      `SELECT ${parentColumn} AS parent_id, position
       FROM ${table}
       ORDER BY ${parentColumn}, position`
    )
    .all() as { parent_id: string; position: number }[];

  let currentParent: string | undefined;
  let usedPositions = new Set<number>();

  for (const row of rows) {
    if (row.parent_id !== currentParent) {
      currentParent = row.parent_id;
      usedPositions = new Set();
      if (row.position !== 0) {
        throw new Error("Line-item positions are invalid after the database upgrade.");
      }
    }

    if (row.position % 65_536 !== 0 || usedPositions.has(row.position)) {
      throw new Error("Line-item positions are invalid after the database upgrade.");
    }
    usedPositions.add(row.position);
  }
}

/** Reads quantity and total sums for each sale or estimate. */
function getItemTotals(
  sqlite: Database.Database,
  itemTable: "sale_items" | "estimate_items",
  parentColumn: "sale_id" | "estimate_id"
): Map<string, { quantity: number; total: number }> {
  const rows = sqlite
    .prepare(
      `SELECT ${parentColumn} AS parent_id,
              SUM(quantity) AS quantity,
              SUM(total_price) AS total
       FROM ${itemTable}
       GROUP BY ${parentColumn}`
    )
    .all() as { parent_id: string; quantity: number; total: number }[];

  return new Map(rows.map((row) => [row.parent_id, { quantity: row.quantity, total: row.total }]));
}

/** Compares saved transaction totals with the item sums. */
function verifyTransactionTotals(
  sqlite: Database.Database,
  parentTable: "sales" | "estimates",
  itemTable: "sale_items" | "estimate_items",
  parentColumn: "sale_id" | "estimate_id"
): void {
  const totalsByParent = getItemTotals(sqlite, itemTable, parentColumn);
  const transactions = sqlite
    .prepare(`SELECT id, total_quantity, grand_total FROM ${parentTable}`)
    .all() as { id: string; total_quantity: number | null; grand_total: number | null }[];

  for (const transaction of transactions) {
    const itemTotals = totalsByParent.get(transaction.id) ?? { quantity: 0, total: 0 };
    if (
      (transaction.total_quantity ?? 0) !== itemTotals.quantity ||
      (transaction.grand_total ?? 0) !== itemTotals.total
    ) {
      throw new Error("Transaction totals are inconsistent after the database upgrade.");
    }
  }
}

/** Reads the sold quantity for each product from one item table. */
function getProductQuantities(
  sqlite: Database.Database,
  itemTable: "sale_items" | "estimate_items"
): Map<string, number> {
  const rows = sqlite
    .prepare(
      `SELECT product_id, SUM(quantity) AS quantity
       FROM ${itemTable}
       WHERE product_id IS NOT NULL
       GROUP BY product_id`
    )
    .all() as { product_id: string; quantity: number }[];

  return new Map(rows.map((row) => [row.product_id, row.quantity]));
}

/** Compares each product quantity with its sale and estimate items. */
function verifyProductQuantities(sqlite: Database.Database): void {
  const saleQuantities = getProductQuantities(sqlite, "sale_items");
  const estimateQuantities = getProductQuantities(sqlite, "estimate_items");
  const products = sqlite.prepare("SELECT id, total_quantity_sold FROM products").all() as {
    id: string;
    total_quantity_sold: number | null;
  }[];

  for (const product of products) {
    const expected =
      (saleQuantities.get(product.id) ?? 0) + (estimateQuantities.get(product.id) ?? 0);
    if ((product.total_quantity_sold ?? 0) !== expected) {
      throw new Error("Product quantities are inconsistent after the database upgrade.");
    }
  }
}

/** Reads the newest item date for each product from one item table. */
function getProductDates(
  sqlite: Database.Database,
  itemTable: "sale_items" | "estimate_items"
): Map<string, string> {
  const rows = sqlite
    .prepare(
      `SELECT product_id, MAX(created_at) AS last_date
       FROM ${itemTable}
       WHERE product_id IS NOT NULL
       GROUP BY product_id`
    )
    .all() as { product_id: string; last_date: string }[];

  return new Map(rows.map((row) => [row.product_id, row.last_date]));
}

/** Compares each product date with its newest sale or estimate item. */
function verifyProductDates(sqlite: Database.Database): void {
  const saleDates = getProductDates(sqlite, "sale_items");
  const estimateDates = getProductDates(sqlite, "estimate_items");
  const products = sqlite.prepare("SELECT id, last_sold_at FROM products").all() as {
    id: string;
    last_sold_at: string | null;
  }[];

  for (const product of products) {
    const dates = [saleDates.get(product.id), estimateDates.get(product.id)].filter(
      (date): date is string => Boolean(date)
    );
    const expected = dates.length === 0 ? null : dates.sort().at(-1)!;
    if (product.last_sold_at !== expected) {
      throw new Error("Product activity dates are inconsistent after the database upgrade.");
    }
  }
}

/** Runs the final checks before QuickCart starts using the upgraded database. */
export function verifyDatabaseUpgrade(sqlite: Database.Database, baseline: UpgradeBaseline): void {
  const databaseCheck = sqlite.pragma("quick_check", { simple: true });
  if (databaseCheck !== "ok") {
    throw new Error("SQLite found a problem after the database upgrade.");
  }

  const foreignKeyFailures = sqlite.pragma("foreign_key_check") as unknown[];
  if (foreignKeyFailures.length > 0) {
    throw new Error("Foreign-key verification failed after the database upgrade.");
  }

  for (const table of PRESERVED_TABLES) {
    const expectedCount =
      table === "customers" &&
      baseline.legacyDefaultsPending &&
      baseline.rowCounts.customers > 0 &&
      !baseline.defaultCustomerExisted
        ? baseline.rowCounts.customers + 1
        : baseline.rowCounts[table];
    if (tableCount(sqlite, table) !== expectedCount) {
      throw new Error(`The ${table} row count changed during the database upgrade.`);
    }
  }

  verifyPurchasePrices(sqlite, "sale_items", baseline.purchasePrices.saleItems);
  verifyPurchasePrices(sqlite, "estimate_items", baseline.purchasePrices.estimateItems);

  verifyNoBlankValues(
    sqlite,
    "products",
    "product_snapshot",
    "A product label is blank after the database upgrade."
  );
  verifyNoBlankValues(
    sqlite,
    "sale_items",
    "product_snapshot",
    "A product label is blank after the database upgrade."
  );
  verifyNoBlankValues(
    sqlite,
    "estimate_items",
    "product_snapshot",
    "A product label is blank after the database upgrade."
  );
  verifyNoBlankValues(
    sqlite,
    "sales",
    "recorded_at",
    "An invoice date is missing after the database upgrade."
  );

  verifyItemPositions(sqlite, "sale_items", "sale_id");
  verifyItemPositions(sqlite, "estimate_items", "estimate_id");

  verifyTransactionTotals(sqlite, "sales", "sale_items", "sale_id");
  verifyTransactionTotals(sqlite, "estimates", "estimate_items", "estimate_id");
  verifyProductQuantities(sqlite);
  verifyProductDates(sqlite);

  if (baseline.legacyDefaultsPending) {
    const ledgerRow = sqlite.prepare("SELECT 1 FROM customer_ledger LIMIT 1").get();
    if (ledgerRow) throw new Error("Legacy customer accounting was not cleared.");

    const customerWithBalance = sqlite
      .prepare("SELECT 1 FROM customers WHERE outstanding_balance <> 0 LIMIT 1")
      .get();
    if (customerWithBalance) throw new Error("Legacy outstanding balances were not cleared.");
  }
}

/** Marks the old unreleased schema as handled without running it again. */
export function adoptPrereleaseSchema(sqlite: Database.Database, migrationsFolder: string): void {
  const migration = readMigrationFiles({ migrationsFolder }).at(-1);
  if (!migration) throw new Error("No database migration was found to adopt.");

  sqlite.transaction(() => {
    sqlite.exec(`
      CREATE TABLE app_data_migrations (
        id text PRIMARY KEY NOT NULL,
        applied_at text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
      );
    `);
    sqlite
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run(migration.hash, migration.folderMillis);
  })();
}

/** Builds one progress update for the upgrade window. */
export function createUpgradeStatus(
  inspection: UpgradeInspection,
  state: DatabaseUpgradeStatus["state"],
  label: string,
  currentStep: number,
  backupAvailable: boolean
): DatabaseUpgradeStatus {
  return {
    state,
    label,
    currentStep,
    totalSteps: inspection.totalSteps,
    backupAvailable
  };
}
