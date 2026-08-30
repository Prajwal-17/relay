import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { productHistory, products } from "../../../db/schema";
import {
  createProductsTestApp,
  createTestDb,
  dbMock,
  getJson,
  productPayload,
  readJson,
  requestJson,
  type DB
} from "../../../tests/helpers";

type ErrorBody = {
  error: { message: string; details?: { field: string; message: string }[] };
};

describe("products write integration", () => {
  let app: ReturnType<typeof createProductsTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createProductsTestApp();
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it("creates a product, stores integer paisa, generates its snapshot, and writes initial history", async () => {
    const response = await requestJson(app, "POST", "/api/products", productPayload());
    const body = await readJson<{ id: string; name: string }>(response);

    expect(response.status).toBe(201);
    expect(body.name).toBe("Arabica Coffee");

    const saved = db.select().from(products).where(eq(products.id, body.id)).get();
    expect(saved).toMatchObject({
      name: "Arabica Coffee",
      imageUrl: null,
      weight: "500",
      unit: "g",
      mrp: 45000,
      price: 39900,
      purchasePrice: 31000,
      productSnapshot: "Arabica Coffee 500g 450Rs",
      isDisabled: false,
      isDeleted: false
    });

    const history = db
      .select()
      .from(productHistory)
      .where(eq(productHistory.productId, body.id))
      .all();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      oldPrice: null,
      newPrice: 39900,
      oldMrp: null,
      newMrp: 45000,
      oldPurchasePrice: null,
      newPurchasePrice: 31000
    });
  });

  it("normalizes omitted and empty optional fields", async () => {
    const response = await requestJson(app, "POST", "/api/products", {
      name: "Loose Tea",
      imageUrl: null,
      weight: "",
      unit: "none",
      mrp: "",
      price: 12500,
      purchasePrice: ""
    });
    const body = await readJson<{ id: string }>(response);

    expect(response.status).toBe(201);
    expect(db.select().from(products).where(eq(products.id, body.id)).get()).toMatchObject({
      name: "Loose Tea",
      weight: null,
      unit: null,
      mrp: null,
      price: 12500,
      purchasePrice: null,
      productSnapshot: "Loose Tea"
    });
  });

  it.each([
    ["short name", { ...productPayload(), name: "A" }, "Name must be more than 2 characters"],
    ["zero price", { ...productPayload(), price: 0 }, "Price must be greater than zero"],
    ["invalid price", { ...productPayload(), price: "money" }, "Price must be a number"],
    [
      "weight without unit",
      { ...productPayload(), unit: null },
      "Select a unit or clear the weight"
    ],
    [
      "unit without weight",
      { ...productPayload(), weight: null },
      "Enter a weight or set Unit to none"
    ]
  ])("rejects %s without database side effects", async (_label, payload, message) => {
    const response = await requestJson(app, "POST", "/api/products", payload);
    const body = await readJson<ErrorBody>(response);

    expect(response.status).toBe(400);
    expect(body.error.message).toContain(message);
    expect(db.select().from(products).all()).toEqual([]);
    expect(db.select().from(productHistory).all()).toEqual([]);
  });

  it("retrieves a product and rejects missing or malformed IDs", async () => {
    const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
    const created = await readJson<{ id: string }>(createResponse);

    const response = await getJson(app, `/api/products/${created.id}`);
    expect(response.status).toBe(200);
    expect(await readJson<{ id: string; price: number }>(response)).toMatchObject({
      id: created.id,
      price: 39900
    });

    const missing = await getJson(app, `/api/products/${crypto.randomUUID()}`);
    expect(missing.status).toBe(404);
    expect(await readJson<ErrorBody>(missing)).toEqual({
      error: { message: "Product not found" }
    });

    const invalid = await getJson(app, "/api/products/not-a-uuid");
    expect(invalid.status).toBe(400);
    expect((await readJson<ErrorBody>(invalid)).error.message).toBe("Id param is invalid");
  });

  it("partially updates a product without overwriting untouched fields and regenerates its snapshot", async () => {
    const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
    const created = await readJson<{ id: string }>(createResponse);

    const response = await requestJson(app, "PATCH", `/api/products/${created.id}`, {
      name: "Premium Arabica",
      weight: "1",
      unit: "kg"
    });

    expect(response.status).toBe(200);
    expect(db.select().from(products).where(eq(products.id, created.id)).get()).toMatchObject({
      name: "Premium Arabica",
      weight: "1",
      unit: "kg",
      price: 39900,
      mrp: 45000,
      purchasePrice: 31000,
      imageUrl: null,
      productSnapshot: "Premium Arabica 450Rs"
    });

    const history = db
      .select()
      .from(productHistory)
      .where(eq(productHistory.productId, created.id))
      .all();
    expect(history).toHaveLength(1);
  });

  it.each([
    ["weight", { weight: null }, "Enter a weight or set Unit to none"],
    ["unit", { unit: null }, "Select a unit or clear the weight"]
  ])(
    "rejects clearing only the %s while preserving the stored measurement",
    async (_field, payload, message) => {
      const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
      const created = await readJson<{ id: string }>(createResponse);

      const response = await requestJson(app, "PATCH", `/api/products/${created.id}`, payload);

      expect(response.status).toBe(400);
      expect((await readJson<ErrorBody>(response)).error.message).toBe(message);
      expect(db.select().from(products).where(eq(products.id, created.id)).get()).toMatchObject({
        weight: "500",
        unit: "g"
      });
    }
  );

  it("normalizes the none unit and maintains disable timestamps", async () => {
    const createResponse = await requestJson(
      app,
      "POST",
      "/api/products",
      productPayload({ weight: null, unit: null })
    );
    const created = await readJson<{ id: string }>(createResponse);

    const disabled = await requestJson(app, "PATCH", `/api/products/${created.id}`, {
      unit: "none",
      isDisabled: true
    });
    expect(disabled.status).toBe(200);
    const disabledRow = db.select().from(products).where(eq(products.id, created.id)).get();
    expect(disabledRow?.unit).toBeNull();
    expect(disabledRow?.isDisabled).toBe(true);
    expect(disabledRow?.disabledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const enabled = await requestJson(app, "PATCH", `/api/products/${created.id}`, {
      isDisabled: false
    });
    expect(enabled.status).toBe(200);
    expect(db.select().from(products).where(eq(products.id, created.id)).get()).toMatchObject({
      isDisabled: false,
      disabledAt: null
    });
  });

  it("records only changed price fields in history and exposes newest entries first", async () => {
    const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
    const created = await readJson<{ id: string }>(createResponse);
    db.update(productHistory)
      .set({ createdAt: "2026-01-01T00:00:00.000Z" })
      .where(eq(productHistory.productId, created.id))
      .run();

    const first = await requestJson(app, "PATCH", `/api/products/${created.id}`, {
      price: 38900,
      mrp: 44000
    });
    expect(first.status).toBe(200);
    db.update(productHistory)
      .set({ createdAt: "2026-02-01T00:00:00.000Z" })
      .where(and(eq(productHistory.productId, created.id), eq(productHistory.newPrice, 38900)))
      .run();

    const second = await requestJson(app, "PATCH", `/api/products/${created.id}`, {
      purchasePrice: 30000
    });
    expect(second.status).toBe(200);
    db.update(productHistory)
      .set({ createdAt: "2026-03-01T00:00:00.000Z" })
      .where(
        and(eq(productHistory.productId, created.id), eq(productHistory.newPurchasePrice, 30000))
      )
      .run();

    const response = await getJson(app, `/api/products/${created.id}/history`);
    const body = await readJson<{
      productId: string;
      entries: Array<Record<string, number | string | null>>;
    }>(response);

    expect(response.status).toBe(200);
    expect(body.productId).toBe(created.id);
    expect(body.entries).toHaveLength(3);
    expect(body.entries[0]).toMatchObject({
      oldPurchasePrice: 31000,
      newPurchasePrice: 30000,
      oldPrice: null,
      newPrice: null,
      oldMrp: null,
      newMrp: null
    });
    expect(body.entries[1]).toMatchObject({
      oldPrice: 39900,
      newPrice: 38900,
      oldMrp: 45000,
      newMrp: 44000,
      oldPurchasePrice: null,
      newPurchasePrice: null
    });
  });

  it("rejects invalid and missing update IDs without changing persisted products", async () => {
    const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
    const created = await readJson<{ id: string }>(createResponse);
    const before = db.select().from(products).where(eq(products.id, created.id)).get();

    const invalid = await requestJson(app, "PATCH", "/api/products/not-a-uuid", { price: 1 });
    expect(invalid.status).toBe(400);

    const missing = await requestJson(app, "PATCH", `/api/products/${crypto.randomUUID()}`, {
      price: 1
    });
    expect(missing.status).toBe(400);
    expect(await readJson<ErrorBody>(missing)).toEqual({
      error: { message: "Product not found" }
    });
    expect(db.select().from(products).where(eq(products.id, created.id)).get()).toEqual(before);
  });
});
