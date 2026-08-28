import { eq } from "drizzle-orm";
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
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  seedSale,
  seedSaleItem,
  type DB
} from "../../../tests/helpers";

type SearchBody = {
  nextPageNo: number | null;
  totalCount: number;
  data: Array<{ id: string }>;
};

describe("products lifecycle integration", () => {
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

  it("soft deletes and restores a product with timestamps and search visibility", async () => {
    const product = await seedProduct(db, {
      name: "Lifecycle Product",
      productSnapshot: "Lifecycle Product"
    });

    const deleted = await requestJson(app, "POST", `/api/products/${product.id}/delete`);
    expect(deleted.status).toBe(204);
    expect(db.select().from(products).where(eq(products.id, product.id)).get()).toMatchObject({
      isDeleted: true,
      deletedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });

    const activeSearch = await getJson(app, "/api/products/search");
    expect((await readJson<SearchBody>(activeSearch)).data).toEqual([]);

    const deletedSearch = await getJson(app, "/api/products/search?filterType=deleted");
    expect((await readJson<SearchBody>(deletedSearch)).data.map((item) => item.id)).toEqual([
      product.id
    ]);

    const restored = await requestJson(app, "POST", `/api/products/${product.id}/restore`);
    expect(restored.status).toBe(204);
    expect(db.select().from(products).where(eq(products.id, product.id)).get()).toMatchObject({
      isDeleted: false,
      deletedAt: null
    });

    const restoredSearch = await getJson(app, "/api/products/search");
    expect((await readJson<SearchBody>(restoredSearch)).data.map((item) => item.id)).toEqual([
      product.id
    ]);
  });

  it("permanently deletes an unlinked product and its cascading history", async () => {
    const createResponse = await requestJson(app, "POST", "/api/products", productPayload());
    const created = await readJson<{ id: string }>(createResponse);
    expect(
      db.select().from(productHistory).where(eq(productHistory.productId, created.id)).all()
    ).toHaveLength(1);

    const response = await requestJson(app, "DELETE", `/api/products/${created.id}/delete`);

    expect(response.status).toBe(204);
    expect(db.select().from(products).where(eq(products.id, created.id)).get()).toBeUndefined();
    expect(
      db.select().from(productHistory).where(eq(productHistory.productId, created.id)).all()
    ).toEqual([]);
  });

  it.each([
    [true, false, "1 sale(s)"],
    [false, true, "1 estimate(s)"],
    [true, true, "1 sale(s) and 1 estimate(s)"]
  ])(
    "blocks permanent deletion when sale=%s and estimate=%s links exist",
    async (withSale, withEstimate, linkedDescription) => {
      const customer = await seedCustomer(db);
      const product = await seedProduct(db, {
        name: "Linked Product",
        productSnapshot: "Linked Product"
      });

      if (withSale) {
        const sale = await seedSale(db, {
          invoiceNo: 81,
          customerId: customer.id,
          createdAt: "2026-01-01T10:00:00.000Z"
        });
        await seedSaleItem(db, {
          saleId: sale.id,
          productId: product.id,
          name: product.name,
          productSnapshot: product.productSnapshot,
          price: product.price,
          quantity: 1000,
          totalPrice: product.price
        });
      }

      if (withEstimate) {
        const estimate = await seedEstimate(db, {
          estimateNo: 91,
          customerId: customer.id,
          createdAt: "2026-01-02T10:00:00.000Z"
        });
        await seedEstimateItem(db, {
          estimateId: estimate.id,
          productId: product.id,
          name: product.name,
          productSnapshot: product.productSnapshot,
          price: product.price,
          quantity: 1000,
          totalPrice: product.price
        });
      }

      const before = db.select().from(products).where(eq(products.id, product.id)).get();
      const response = await requestJson(app, "DELETE", `/api/products/${product.id}/delete`);
      const body = await readJson<{ error: { message: string } }>(response);

      expect(response.status).toBe(400);
      expect(body.error.message).toBe(
        `Cannot delete product. It is currently linked to ${linkedDescription}.`
      );
      expect(db.select().from(products).where(eq(products.id, product.id)).get()).toEqual(before);
    }
  );

  it("rejects lifecycle operations for invalid or missing IDs without changing products", async () => {
    const product = await seedProduct(db);
    const before = db.select().from(products).where(eq(products.id, product.id)).get();

    const invalid = await requestJson(app, "POST", "/api/products/not-a-uuid/delete");
    expect(invalid.status).toBe(400);

    const missingId = crypto.randomUUID();
    const missingDelete = await requestJson(app, "POST", `/api/products/${missingId}/delete`);
    expect(missingDelete.status).toBe(400);
    expect(await readJson<{ error: { message: string } }>(missingDelete)).toEqual({
      error: { message: "No product was deleted." }
    });

    const missingRestore = await requestJson(app, "POST", `/api/products/${missingId}/restore`);
    expect(missingRestore.status).toBe(400);
    expect(await readJson<{ error: { message: string } }>(missingRestore)).toEqual({
      error: { message: "No product was restored." }
    });

    expect(db.select().from(products).where(eq(products.id, product.id)).get()).toEqual(before);
  });
});
