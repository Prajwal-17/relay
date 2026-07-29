import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appInstance, appPreferences, customers, storeProfile } from "../../../db/schema";
import { onboardingController } from "../../../modules/onboarding/onboarding.controller";
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

describe("onboarding integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/onboarding", controller: onboardingController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it("reports incomplete before registration and complete afterwards", async () => {
    const before = await getJson(app, "/api/onboarding/status");
    expect(await readJson<{ isComplete: boolean }>(before)).toEqual({ isComplete: false });

    const created = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    expect(created.status).toBe(201);

    const after = await getJson(app, "/api/onboarding/status");
    expect(await readJson<{ isComplete: boolean }>(after)).toEqual({ isComplete: true });
  });

  it("creates app, store, default customer, and preferences atomically", async () => {
    const response = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    const body = await readJson<{
      appInstance: { id: string; os: string };
      storeProfile: { id: string; storeName: string };
      customerId: string;
      preferences: { config: { billing: { defaultCustomerId: string } } };
    }>(response);

    expect(response.status).toBe(201);
    expect(body.appInstance.id).toBe("default");
    expect(body.storeProfile).toMatchObject({ id: "default", storeName: "QuickCart Market" });
    expect(body.preferences.config.billing.defaultCustomerId).toBe(body.customerId);

    expect(db.select().from(appInstance).all()).toHaveLength(1);
    expect(db.select().from(storeProfile).all()).toHaveLength(1);
    expect(db.select().from(customers).all()).toEqual([
      expect.objectContaining({ id: body.customerId, name: "DEFAULT", storeId: "default" })
    ]);
    expect(db.select().from(appPreferences).all()).toEqual([
      expect.objectContaining({ storeId: "default" })
    ]);
  });

  it("rejects invalid registration without partial rows", async () => {
    const response = await requestJson(
      app,
      "POST",
      "/api/onboarding",
      onboardingPayload({ phone: "123", email: "invalid" })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(appInstance).all()).toEqual([]);
    expect(db.select().from(storeProfile).all()).toEqual([]);
    expect(db.select().from(customers).all()).toEqual([]);
    expect(db.select().from(appPreferences).all()).toEqual([]);
  });

  it("rejects repeat registration without changing existing records", async () => {
    const first = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    expect(first.status).toBe(201);
    const before = {
      appInstances: db.select().from(appInstance).all(),
      profiles: db.select().from(storeProfile).all(),
      customers: db.select().from(customers).all(),
      preferences: db.select().from(appPreferences).all()
    };

    const second = await requestJson(
      app,
      "POST",
      "/api/onboarding",
      onboardingPayload({ storeName: "Another Store" })
    );

    expect(second.status).toBe(400);
    expect(await readJson<{ error: { message: string } }>(second)).toEqual({
      error: { message: "You have already registered. Cannot create new entry" }
    });
    expect(db.select().from(appInstance).all()).toEqual(before.appInstances);
    expect(db.select().from(storeProfile).all()).toEqual(before.profiles);
    expect(db.select().from(customers).all()).toEqual(before.customers);
    expect(db.select().from(appPreferences).all()).toEqual(before.preferences);
  });
});
