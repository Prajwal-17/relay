import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { coordinateDatabaseUpgrade } from "../../../db/upgradeCoordinator";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("file-backed database upgrade", () => {
  it("migrates a blank file once and preserves data on the next startup", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "quickcart-migration-test-"));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, "pos.db");
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
});
