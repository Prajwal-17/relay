import type Database from "better-sqlite3";
import type { AppConfig } from "../../../shared/types";

export const PRESERVED_TABLES = [
  "customers",
  "products",
  "sales",
  "sale_items",
  "estimates",
  "estimate_items"
] as const;

export type PreservedTable = (typeof PRESERVED_TABLES)[number];
export type PreservedRowCounts = Record<PreservedTable, number>;

export type PurchasePriceBaseline = {
  saleItems: Map<string, number | null>;
  estimateItems: Map<string, number | null>;
};

export type UpgradeBaseline = {
  rowCounts: PreservedRowCounts;
  purchasePrices: PurchasePriceBaseline;
  defaultCustomerExisted: boolean;
  legacyDefaultsPending: boolean;
};

export type DataMigrationContext = {
  sqlite: Database.Database;
  isLegacyDatabase: boolean;
  defaultConfig: AppConfig;
  platform: NodeJS.Platform;
};

export type DataMigration = {
  id: string;
  label: string;
  run(context: DataMigrationContext): void;
};
