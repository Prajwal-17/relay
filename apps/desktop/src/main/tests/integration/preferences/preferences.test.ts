import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppConfig } from "../../../../shared/types";
import { appPreferences } from "../../../db/schema";
import { onboardingController } from "../../../modules/onboarding/onboarding.controller";
import { preferencesController } from "../../../modules/preferences/preferences.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  onboardingPayload,
  readJson,
  requestJson,
  type DB
} from "../../helpers";

type PreferencesBody = {
  id: string;
  storeId: string;
  config: AppConfig;
};

describe("preferences integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([
      { path: "/api/onboarding", controller: onboardingController },
      { path: "/api/app-preferences", controller: preferencesController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  async function onboard() {
    const response = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    expect(response.status).toBe(201);
    return readJson<{ customerId: string }>(response);
  }

  it("returns production defaults without requiring onboarding", async () => {
    const response = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(response);

    expect(response.status).toBe(200);
    expect(defaults.billing).toEqual({ defaultCustomerId: "", searchDropdown: { scale: 1 } });
    expect(defaults.exports).toMatchObject({
      askBeforeSavingPdf: true,
      defaultExportFormat: "pdf"
    });
    expect(defaults.exports.defaultPdfLocation).toContain("Downloads");
  });

  it("returns 404 for missing persisted preferences", async () => {
    const getResponse = await getJson(app, "/api/app-preferences");
    expect(getResponse.status).toBe(404);

    const patchResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.1 } }
    });
    expect(patchResponse.status).toBe(404);
    expect(db.select().from(appPreferences).all()).toEqual([]);
  });

  it("loads onboarding preferences and deeply merges partial updates", async () => {
    const { customerId } = await onboard();
    const defaultsResponse = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(defaultsResponse);

    const beforeResponse = await getJson(app, "/api/app-preferences");
    const before = await readJson<PreferencesBody>(beforeResponse);
    expect(before.config.billing.defaultCustomerId).toBe(customerId);

    const response = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.25 } },
      exports: { askBeforeSavingPdf: false }
    });
    const updated = await readJson<PreferencesBody>(response);

    expect(response.status).toBe(200);
    expect(updated.config.billing).toEqual({
      defaultCustomerId: customerId,
      searchDropdown: { scale: 1.25 }
    });
    expect(updated.config.exports).toEqual({
      ...defaults.exports,
      askBeforeSavingPdf: false
    });
    expect(
      db.select().from(appPreferences).where(eq(appPreferences.storeId, "default")).get()?.config
    ).toEqual(updated.config);
  });

  it("rejects invalid scale without changing preferences", async () => {
    await onboard();
    const before = db.select().from(appPreferences).get();

    const response = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 2 } }
    });

    expect(response.status).toBe(400);
    expect(db.select().from(appPreferences).get()).toEqual(before);
  });

  it("resets only exports and rejects unknown reset sections", async () => {
    const { customerId } = await onboard();
    await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.2 } },
      exports: {
        askBeforeSavingPdf: false,
        defaultPdfLocation: "/tmp/custom",
        defaultExportFormat: "png"
      }
    });
    const defaultsResponse = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(defaultsResponse);

    const resetResponse = await requestJson(app, "POST", "/api/app-preferences/reset/exports");
    const reset = await readJson<PreferencesBody>(resetResponse);
    expect(reset.config.exports).toEqual(defaults.exports);
    expect(reset.config.billing).toEqual({
      defaultCustomerId: customerId,
      searchDropdown: { scale: 1.2 }
    });

    const invalid = await requestJson(app, "POST", "/api/app-preferences/reset/billing");
    expect(invalid.status).toBe(400);
  });
});
