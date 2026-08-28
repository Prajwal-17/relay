import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { products, saleItems, sales } from "../../../db/schema";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  postTxn,
  salePayload,
  seedCustomer,
  seedProduct,
  seedSale,
  seedSaleItem,
  transactionItem,
  type DB
} from "../../helpers";

describe("sales validation integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/sales", controller: salesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it.each([
    ["missing wrapper", {}],
    ["wrong transaction type", { data: { transactionType: "estimate" } }],
    ["invalid customer ID", { data: { ...salePayload(crypto.randomUUID()), customerId: "bad" } }],
    [
      "invalid row ID",
      {
        data: salePayload(crypto.randomUUID(), {
          items: [transactionItem({ rowId: "bad" })]
        })
      }
    ],
    [
      "zero price",
      {
        data: salePayload(crypto.randomUUID(), {
          items: [transactionItem({ price: 0 })]
        })
      }
    ],
    [
      "zero quantity",
      {
        data: salePayload(crypto.randomUUID(), {
          items: [transactionItem({ quantity: 0 })]
        })
      }
    ]
  ])("rejects %s without creating rows", async (_label, payload) => {
    const response = await app.request("/api/sales/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(400);
    expect(db.select().from(sales).all()).toEqual([]);
    expect(db.select().from(saleItems).all()).toEqual([]);
  });

  it("rolls back when an item references a missing product", async () => {
    const customer = await seedCustomer(db);
    const response = await postTxn(
      app,
      "/api/sales/create",
      salePayload(customer.id, {
        items: [transactionItem({ productId: crypto.randomUUID() })]
      })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(sales).all()).toEqual([]);
    expect(db.select().from(saleItems).all()).toEqual([]);
  });

  it("rolls back a duplicate invoice number without changing product quantities", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 5000 });
    await seedSale(db, { invoiceNo: 44, customerId: customer.id });

    const response = await postTxn(
      app,
      "/api/sales/create",
      salePayload(customer.id, {
        transactionNo: 44,
        items: [
          transactionItem({
            productId: product.id,
            name: product.name,
            productSnapshot: product.productSnapshot
          })
        ]
      })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(sales).all()).toHaveLength(1);
    expect(db.select().from(saleItems).all()).toEqual([]);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(5000);
  });

  it("rejects invalid sync input without changing the sale", async () => {
    const customer = await seedCustomer(db);
    const sale = await seedSale(db, {
      invoiceNo: 45,
      customerId: customer.id,
      grandTotal: 10000,
      totalQuantity: 1000
    });
    const item = await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      price: 10000,
      quantity: 1000,
      totalPrice: 10000
    });
    const beforeSale = db.select().from(sales).where(eq(sales.id, sale.id)).get();
    const beforeItem = db.select().from(saleItems).where(eq(saleItems.id, item.id)).get();

    const response = await postTxn(
      app,
      `/api/sales/${sale.id}/sync`,
      salePayload(customer.id, { items: [transactionItem({ price: -1 })] })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(sales).where(eq(sales.id, sale.id)).get()).toEqual(beforeSale);
    expect(db.select().from(saleItems).where(eq(saleItems.id, item.id)).get()).toEqual(beforeItem);
  });

  it("rejects invalid and missing sync IDs without creating rows", async () => {
    const customer = await seedCustomer(db);
    expect(
      (await postTxn(app, "/api/sales/not-a-uuid/sync", salePayload(customer.id))).status
    ).toBe(400);
    expect(
      (await postTxn(app, `/api/sales/${crypto.randomUUID()}/sync`, salePayload(customer.id)))
        .status
    ).toBe(404);
    expect(db.select().from(sales).all()).toEqual([]);
  });
});
