import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { coordinateDatabaseUpgrade } from "../../../db/upgradeCoordinator";

const temporaryDirectories: string[] = [];

function columnNames(sqlite: import("better-sqlite3").Database, table: string): Set<string> {
  return new Set(
    (sqlite.pragma(`table_info(${table})`) as { name: string }[]).map((column) => column.name)
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("file-backed database upgrade", () => {
  it("migrates a blank file once and preserves data on the next startup", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "relay-migration-test-"));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, "relay.db");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");

    const first = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });
    expect(first.inspection).toMatchObject({ required: true, isFreshDatabase: true });

    const tableNames = new Set(
      (
        first.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{
          name: string;
        }>
      ).map((row) => row.name)
    );
    for (const table of [
      "app_instance",
      "store_profile",
      "customers",
      "products",
      "sales",
      "sale_items",
      "estimates",
      "estimate_items",
      "__drizzle_migrations"
    ]) {
      expect(tableNames.has(table), `${table} should exist`).toBe(true);
    }
    expect(first.sqlite.pragma("integrity_check", { simple: true })).toBe("ok");

    first.sqlite
      .prepare("INSERT INTO app_instance (id, os) VALUES (?, ?)")
      .run("file-backed-marker", "test");
    first.sqlite.close();

    const second = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });
    expect(second.inspection.required).toBe(false);
    expect(
      second.sqlite.prepare("SELECT os FROM app_instance WHERE id = ?").get("file-backed-marker")
    ).toEqual({ os: "test" });
    expect(second.sqlite.pragma("integrity_check", { simple: true })).toBe("ok");
    second.sqlite.close();
  });

  it("applies 0031 to databases that recorded the original 0030 without creation tokens", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "relay-creation-token-repair-test-"));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, "relay.db");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");

    const historical = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });
    historical.sqlite
      .prepare("INSERT INTO customers (id, name, customer_type) VALUES (?, ?, ?)")
      .run("historical-customer", "Historical customer", "cash");
    historical.sqlite
      .prepare(
        `INSERT INTO sales (id, invoice_no, customer_id, grand_total, total_quantity)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run("historical-sale", 1, "historical-customer", 100, 1000);
    historical.sqlite
      .prepare(
        `INSERT INTO estimates (id, estimate_no, customer_id, grand_total, total_quantity)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run("historical-estimate", 1, "historical-customer", 100, 1000);
    historical.sqlite
      .prepare(
        `INSERT INTO sale_items (
           id, sale_id, name, product_snapshot, price, quantity, total_price, position
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "historical-sale-item",
        "historical-sale",
        "Historical item",
        "Historical item",
        100,
        1000,
        100,
        24_576
      );
    historical.sqlite
      .prepare(
        `INSERT INTO estimate_items (
           id, estimate_id, name, product_snapshot, price, quantity, total_price, position
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "historical-estimate-item",
        "historical-estimate",
        "Historical item",
        "Historical item",
        100,
        1000,
        100,
        131_072
      );
    historical.sqlite.exec(`
      DROP INDEX sales_creation_token_unique;
      DROP INDEX estimates_creation_token_unique;
      ALTER TABLE sales DROP COLUMN creation_token;
      ALTER TABLE estimates DROP COLUMN creation_token;
    `);
    historical.sqlite.exec(`
      DELETE FROM __drizzle_migrations
      WHERE created_at = (SELECT MAX(created_at) FROM __drizzle_migrations);
    `);
    historical.sqlite.close();

    const repaired = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });

    expect(repaired.inspection).toMatchObject({
      required: true,
      schemaPending: true,
      adoptPendingSchemaMigration: false,
      pendingDataMigrationIds: []
    });
    expect(columnNames(repaired.sqlite, "sales")).toContain("creation_token");
    expect(columnNames(repaired.sqlite, "estimates")).toContain("creation_token");
    expect(
      repaired.sqlite.prepare("SELECT id FROM sales WHERE id = ?").get("historical-sale")
    ).toEqual({ id: "historical-sale" });
    expect(
      repaired.sqlite.prepare("SELECT id FROM estimates WHERE id = ?").get("historical-estimate")
    ).toEqual({ id: "historical-estimate" });
    expect(
      repaired.sqlite
        .prepare("SELECT position FROM sale_items WHERE id = ?")
        .get("historical-sale-item")
    ).toEqual({ position: 24_576 });
    expect(
      repaired.sqlite
        .prepare("SELECT position FROM estimate_items WHERE id = ?")
        .get("historical-estimate-item")
    ).toEqual({ position: 131_072 });

    repaired.sqlite
      .prepare("UPDATE sales SET creation_token = ? WHERE id = ?")
      .run("stable-token", "historical-sale");
    expect(() =>
      repaired.sqlite
        .prepare(
          "INSERT INTO sales (id, creation_token, invoice_no, customer_id) VALUES (?, ?, ?, ?)"
        )
        .run("duplicate-token-sale", "stable-token", 2, "historical-customer")
    ).toThrow();
    expect(repaired.sqlite.pragma("integrity_check", { simple: true })).toBe("ok");
    repaired.sqlite.close();
  });

  it("adopts 0031 when the edited 0030 already added the creation-token schema", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "relay-creation-token-adopt-test-"));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, "relay.db");
    const migrationsFolder = path.resolve(process.cwd(), "drizzle");

    const historical = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });
    historical.sqlite
      .prepare("INSERT INTO customers (id, name, customer_type) VALUES (?, ?, ?)")
      .run("edited-0030-customer", "Edited 0030 customer", "cash");
    historical.sqlite
      .prepare(
        `INSERT INTO sales (id, creation_token, invoice_no, customer_id)
         VALUES (?, ?, ?, ?)`
      )
      .run("edited-0030-sale", "preserved-token", 1, "edited-0030-customer");
    historical.sqlite.exec(`
      DELETE FROM __drizzle_migrations
      WHERE created_at = (SELECT MAX(created_at) FROM __drizzle_migrations);
    `);
    historical.sqlite.close();

    const adopted = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });

    expect(adopted.inspection).toMatchObject({
      required: true,
      schemaPending: true,
      adoptPendingSchemaMigration: true,
      pendingDataMigrationIds: []
    });
    expect(
      adopted.sqlite
        .prepare("SELECT creation_token FROM sales WHERE id = ?")
        .get("edited-0030-sale")
    ).toEqual({ creation_token: "preserved-token" });
    expect(() =>
      adopted.sqlite
        .prepare(
          "INSERT INTO sales (id, creation_token, invoice_no, customer_id) VALUES (?, ?, ?, ?)"
        )
        .run("duplicate-token-sale", "preserved-token", 2, "edited-0030-customer")
    ).toThrow();
    expect(adopted.sqlite.pragma("integrity_check", { simple: true })).toBe("ok");
    adopted.sqlite.close();

    const settled = await coordinateDatabaseUpgrade({ databasePath, migrationsFolder });
    expect(settled.inspection.required).toBe(false);
    settled.sqlite.close();
  });
});
