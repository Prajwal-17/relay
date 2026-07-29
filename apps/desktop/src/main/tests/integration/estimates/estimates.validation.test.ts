import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estimateItems, estimates, products } from "../../../db/schema";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  postTxn,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  transactionItem,
  type DB
} from "../../helpers";

describe("estimates validation integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/estimates", controller: estimatesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it.each([
    ["missing wrapper", {}],
    ["wrong transaction type", { data: { transactionType: "sale" } }],
    ["missing customer", { data: estimatePayload(crypto.randomUUID()) }],
    [
      "invalid row ID",
      {
        data: estimatePayload(crypto.randomUUID(), {
          items: [transactionItem({ rowId: "bad" })]
        })
      }
    ],
    [
      "zero price",
      {
        data: estimatePayload(crypto.randomUUID(), {
          items: [transactionItem({ price: 0 })]
        })
      }
    ],
    [
      "zero quantity",
      {
        data: estimatePayload(crypto.randomUUID(), {
          items: [transactionItem({ quantity: 0 })]
        })
      }
    ]
  ])("rejects %s without creating rows", async (_label, payload) => {
    const response = await app.request("/api/estimates/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(400);
    expect(db.select().from(estimates).all()).toEqual([]);
    expect(db.select().from(estimateItems).all()).toEqual([]);
  });

  it("rolls back when an item references a missing product", async () => {
    const customer = await seedCustomer(db);
    const response = await postTxn(
      app,
      "/api/estimates/create",
      estimatePayload(customer.id, {
        items: [transactionItem({ productId: crypto.randomUUID() })]
      })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(estimates).all()).toEqual([]);
    expect(db.select().from(estimateItems).all()).toEqual([]);
  });

  it("rolls back a duplicate estimate number without changing product quantities", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 5000 });
    await seedEstimate(db, { estimateNo: 44, customerId: customer.id });

    const response = await postTxn(
      app,
      "/api/estimates/create",
      estimatePayload(customer.id, {
        transactionNo: 44,
        items: [transactionItem({ productId: product.id })]
      })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(estimates).all()).toHaveLength(1);
    expect(db.select().from(estimateItems).all()).toEqual([]);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(5000);
  });

  it("rejects invalid sync input without changing the estimate", async () => {
    const customer = await seedCustomer(db);
    const estimate = await seedEstimate(db, {
      estimateNo: 45,
      customerId: customer.id,
      grandTotal: 10000,
      totalQuantity: 1000
    });
    const item = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      price: 10000,
      quantity: 1000,
      totalPrice: 10000
    });
    const beforeEstimate = db.select().from(estimates).where(eq(estimates.id, estimate.id)).get();
    const beforeItem = db.select().from(estimateItems).where(eq(estimateItems.id, item.id)).get();

    const response = await postTxn(
      app,
      `/api/estimates/${estimate.id}/sync`,
      estimatePayload(customer.id, { items: [transactionItem({ price: -1 })] })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(estimates).where(eq(estimates.id, estimate.id)).get()).toEqual(
      beforeEstimate
    );
    expect(db.select().from(estimateItems).where(eq(estimateItems.id, item.id)).get()).toEqual(
      beforeItem
    );
  });

  it("rejects invalid and missing sync IDs without creating rows", async () => {
    const customer = await seedCustomer(db);
    expect(
      (await postTxn(app, "/api/estimates/not-a-uuid/sync", estimatePayload(customer.id))).status
    ).toBe(400);
    expect(
      (
        await postTxn(
          app,
          `/api/estimates/${crypto.randomUUID()}/sync`,
          estimatePayload(customer.id)
        )
      ).status
    ).toBe(404);
    expect(db.select().from(estimates).all()).toEqual([]);
  });
});
