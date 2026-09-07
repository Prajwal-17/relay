import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const coordinateDatabaseUpgradeMock = vi.hoisted(() => vi.fn());

vi.unmock("../../../db/db");
vi.mock("../../../db/upgradeCoordinator", () => ({
  coordinateDatabaseUpgrade: coordinateDatabaseUpgradeMock
}));

const loadDatabaseModule = () => import("../../../db/db");

describe("database configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    coordinateDatabaseUpgradeMock.mockReset();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses configured database and migration paths", async () => {
    vi.stubEnv("M_VITE_DATABASE_URL", "/data/relay.db");
    vi.stubEnv("M_VITE_MIGRATION_FOLDER", "/app/drizzle");

    const { getDatabasePath, getMigrationsFolder } = await loadDatabaseModule();

    expect(getDatabasePath()).toBe("/data/relay.db");
    expect(getMigrationsFolder()).toBe("/app/drizzle");
  });

  it("uses the development migration folder when none is configured", async () => {
    vi.stubEnv("M_VITE_MIGRATION_FOLDER", "");
    vi.stubEnv("M_VITE_IS_PACKAGED", "false");

    const { getMigrationsFolder } = await loadDatabaseModule();

    expect(getMigrationsFolder()).toBe(path.resolve(process.cwd(), "drizzle"));
  });

  it("rejects a packaged launch without configured migration resources", async () => {
    vi.stubEnv("M_VITE_MIGRATION_FOLDER", "");
    vi.stubEnv("M_VITE_IS_PACKAGED", "true");

    const { getMigrationsFolder } = await loadDatabaseModule();

    expect(() => getMigrationsFolder()).toThrow(
      "Database migration resources were not configured."
    );
  });

  it("coalesces concurrent initialization and reuses the initialized database", async () => {
    vi.stubEnv("M_VITE_DATABASE_URL", "/data/relay.db");
    vi.stubEnv("M_VITE_MIGRATION_FOLDER", "/app/drizzle");
    const database = { marker: "database" };
    coordinateDatabaseUpgradeMock.mockResolvedValue({ db: database });

    const { initDb } = await loadDatabaseModule();
    const onStatus = vi.fn();
    const [first, second] = await Promise.all([initDb({ onStatus }), initDb()]);

    expect(first).toBe(database);
    expect(second).toBe(database);
    expect(await initDb()).toBe(database);
    expect(coordinateDatabaseUpgradeMock).toHaveBeenCalledOnce();
    expect(coordinateDatabaseUpgradeMock).toHaveBeenCalledWith({
      databasePath: "/data/relay.db",
      migrationsFolder: "/app/drizzle",
      onStatus
    });
  });

  it("allows initialization to retry after a failed attempt", async () => {
    vi.stubEnv("M_VITE_DATABASE_URL", "/data/relay.db");
    vi.stubEnv("M_VITE_MIGRATION_FOLDER", "/app/drizzle");
    const database = { marker: "database" };
    coordinateDatabaseUpgradeMock
      .mockRejectedValueOnce(new Error("upgrade failed"))
      .mockResolvedValueOnce({ db: database });

    const { initDb } = await loadDatabaseModule();

    await expect(initDb()).rejects.toThrow("upgrade failed");
    await expect(initDb()).resolves.toBe(database);
    expect(coordinateDatabaseUpgradeMock).toHaveBeenCalledTimes(2);
  });
});
