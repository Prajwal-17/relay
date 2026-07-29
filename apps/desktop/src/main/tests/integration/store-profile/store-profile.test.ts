import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { storeProfile } from "../../../db/schema";
import { onboardingController } from "../../../modules/onboarding/onboarding.controller";
import { storeProfileController } from "../../../modules/storeProfile/storeProfile.controller";
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

describe("store profile integration", () => {
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
      { path: "/api/store-profile", controller: storeProfileController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  async function onboard() {
    const response = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    expect(response.status).toBe(201);
  }

  it("returns 404 before onboarding", async () => {
    const response = await getJson(app, "/api/store-profile");
    expect(response.status).toBe(404);
    expect(await readJson<{ error: { message: string } }>(response)).toEqual({
      error: { message: "Store profile not found" }
    });
  });

  it("retrieves the onboarded profile", async () => {
    await onboard();

    const response = await getJson(app, "/api/store-profile");
    expect(response.status).toBe(200);
    expect(await readJson<Record<string, unknown>>(response)).toMatchObject({
      id: "default",
      storeName: "QuickCart Market",
      ownerName: "Prajwal Reddy",
      phone: "9876543210",
      email: "owner@example.com",
      addressLine1: "12 Market Road",
      addressLine2: null,
      country: "India",
      state: "Karnataka",
      city: "Bengaluru",
      pincode: "560001",
      gstin: null
    });
  });

  it("partially updates the profile without overwriting untouched fields", async () => {
    await onboard();

    const response = await requestJson(app, "PATCH", "/api/store-profile", {
      storeName: "QuickCart Supermarket",
      addressLine2: "First Floor",
      gstin: "29ABCDE1234F1Z5"
    });
    const updated = await readJson<Record<string, unknown>>(response);

    expect(response.status).toBe(200);
    expect(updated).toMatchObject({
      id: "default",
      storeName: "QuickCart Supermarket",
      ownerName: "Prajwal Reddy",
      addressLine2: "First Floor",
      gstin: "29ABCDE1234F1Z5"
    });
    expect(db.select().from(storeProfile).where(eq(storeProfile.id, "default")).get()).toEqual(
      updated
    );
  });

  it("rejects invalid updates without changing persisted state", async () => {
    await onboard();
    const before = db.select().from(storeProfile).where(eq(storeProfile.id, "default")).get();

    const response = await requestJson(app, "PATCH", "/api/store-profile", {
      phone: "123",
      pincode: "12"
    });

    expect(response.status).toBe(400);
    expect(db.select().from(storeProfile).where(eq(storeProfile.id, "default")).get()).toEqual(
      before
    );
  });
});
