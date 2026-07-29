import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customerLedger, customers, products, saleItems, sales } from "../../../db/schema";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  postTxn,
  readJson,
  requestJson,
  salePayload,
  seedCustomer,
  seedProduct,
  seedSale,
  seedSaleItem,
  type DB
} from "../../helpers";

describe("sales lifecycle integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T10:00:00.000Z"));
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/sales", controller: salesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
    vi.useRealTimers();
  });

  it("updates individual and batch checked quantities in milli-units", async () => {
    const customer = await seedCustomer(db);
    const sale = await seedSale(db, {
      invoiceNo: 50,
      customerId: customer.id,
      recordedAt: "2026-07-29T09:00:00.000Z"
    });
    const first = await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      quantity: 3000,
      checkedQty: 0
    });
    await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      quantity: 2000,
      checkedQty: 0
    });

    const increment = await requestJson(
      app,
      "POST",
      `/api/sales/${sale.id}/items/${first.id}/checked-qty`,
      { action: "inc" }
    );
    expect(increment.status).toBe(204);
    expect(db.select().from(saleItems).where(eq(saleItems.id, first.id)).get()?.checkedQty).toBe(
      1000
    );

    await requestJson(app, "POST", `/api/sales/${sale.id}/items/${first.id}/checked-qty`, {
      action: "set"
    });
    expect(db.select().from(saleItems).where(eq(saleItems.id, first.id)).get()?.checkedQty).toBe(
      3000
    );

    const markAll = await requestJson(
      app,
      "POST",
      `/api/sales/${sale.id}/items/checked-qty/batch`,
      { action: "mark_all" }
    );
    expect(markAll.status).toBe(204);
    expect(
      db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, sale.id))
        .all()
        .map((item) => item.checkedQty)
    ).toEqual([3000, 2000]);

    await requestJson(app, "POST", `/api/sales/${sale.id}/items/checked-qty/batch`, {
      action: "unmark_all"
    });
    expect(
      db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, sale.id))
        .all()
        .map((item) => item.checkedQty)
    ).toEqual([0, 0]);
  });

  it("rejects checked-quantity failures without changing items", async () => {
    const customer = await seedCustomer(db);
    const sale = await seedSale(db, {
      invoiceNo: 51,
      customerId: customer.id,
      recordedAt: "2026-07-20T09:00:00.000Z"
    });
    const item = await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      quantity: 3000,
      checkedQty: 1000
    });

    const invalidAction = await requestJson(
      app,
      "POST",
      `/api/sales/${sale.id}/items/${item.id}/checked-qty`,
      { action: "all" }
    );
    expect(invalidAction.status).toBe(400);

    const locked = await requestJson(
      app,
      "POST",
      `/api/sales/${sale.id}/items/${item.id}/checked-qty`,
      { action: "inc" }
    );
    expect(locked.status).toBe(409);
    expect(db.select().from(saleItems).where(eq(saleItems.id, item.id)).get()?.checkedQty).toBe(
      1000
    );

    const missing = await requestJson(
      app,
      "POST",
      `/api/sales/${sale.id}/items/${crypto.randomUUID()}/checked-qty`,
      { action: "inc" }
    );
    expect(missing.status).toBe(400);
    expect(
      (
        await requestJson(
          app,
          "POST",
          `/api/sales/${crypto.randomUUID()}/items/checked-qty/batch`,
          { action: "mark_all" }
        )
      ).status
    ).toBe(404);
  });

  it("duplicates a sale with new IDs, reset checked quantities, and adjusted product totals", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 2000 });
    const sale = await seedSale(db, {
      invoiceNo: 60,
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      notes: "copy me"
    });
    const originalItem = await seedSaleItem(db, {
      saleId: sale.id,
      productId: product.id,
      quantity: 2000,
      checkedQty: 2000,
      totalPrice: 20000
    });

    const response = await requestJson(app, "POST", `/api/sales/${sale.id}/duplicate`);
    const body = await readJson<{ id: string; invoiceNo: number }>(response);

    expect(response.status).toBe(200);
    expect(body.invoiceNo).toBe(61);
    const duplicate = db.select().from(sales).where(eq(sales.id, body.id)).get();
    const duplicateItems = db.select().from(saleItems).where(eq(saleItems.saleId, body.id)).all();
    expect(duplicate).toMatchObject({
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      notes: "copy me"
    });
    expect(duplicateItems).toHaveLength(1);
    expect(duplicateItems[0]).toMatchObject({ productId: product.id, checkedQty: 0 });
    expect(duplicateItems[0]?.id).not.toBe(originalItem.id);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(4000);
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.saleId, body.id)).all()
    ).toEqual([]);
  });

  it("deletes a recent accounted sale and reverses product and customer balances", async () => {
    const customer = await seedCustomer(db, {
      customerType: "account",
      outstandingBalance: 20000
    });
    const product = await seedProduct(db, { totalQuantitySold: 5000 });
    const sale = await seedSale(db, {
      invoiceNo: 70,
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      recordedAt: "2026-07-29T09:00:00.000Z"
    });
    await seedSaleItem(db, {
      saleId: sale.id,
      productId: product.id,
      quantity: 2000,
      totalPrice: 20000
    });
    db.insert(customerLedger)
      .values({ customerId: customer.id, saleId: sale.id, type: "sale", amountDue: 20000 })
      .run();

    const response = await requestJson(app, "DELETE", `/api/sales/${sale.id}`);

    expect(response.status).toBe(204);
    expect(db.select().from(sales).where(eq(sales.id, sale.id)).get()).toBeUndefined();
    expect(db.select().from(saleItems).where(eq(saleItems.saleId, sale.id)).all()).toEqual([]);
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.saleId, sale.id)).all()
    ).toEqual([]);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(3000);
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(0);
  });

  it("blocks modification and deletion after 48 hours without side effects", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 1000 });
    const sale = await seedSale(db, {
      invoiceNo: 71,
      customerId: customer.id,
      grandTotal: 10000,
      totalQuantity: 1000,
      recordedAt: "2026-07-20T09:00:00.000Z"
    });
    await seedSaleItem(db, {
      saleId: sale.id,
      productId: product.id,
      quantity: 1000,
      totalPrice: 10000
    });

    const sync = await postTxn(app, `/api/sales/${sale.id}/sync`, salePayload(customer.id));
    const deletion = await requestJson(app, "DELETE", `/api/sales/${sale.id}`);

    expect(sync.status).toBe(409);
    expect(deletion.status).toBe(409);
    expect(db.select().from(sales).where(eq(sales.id, sale.id)).get()).toMatchObject({
      grandTotal: 10000,
      totalQuantity: 1000
    });
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(1000);
  });

  it("returns failures for invalid and missing duplicate or delete IDs", async () => {
    expect((await requestJson(app, "POST", "/api/sales/not-a-uuid/duplicate")).status).toBe(400);
    expect(
      (await requestJson(app, "POST", `/api/sales/${crypto.randomUUID()}/duplicate`)).status
    ).toBe(404);
    expect((await requestJson(app, "DELETE", `/api/sales/${crypto.randomUUID()}`)).status).toBe(
      400
    );
  });
});

describe("sales accounting integration", () => {
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

  it("creates and removes accounting entries through sale sync", async () => {
    const customer = await seedCustomer(db, { customerType: "account" });
    const create = await postTxn(
      app,
      "/api/sales/create",
      salePayload(customer.id, { addToAccounting: true })
    );
    const created = await readJson<{ billingId: string }>(create);

    expect(create.status).toBe(200);
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.saleId, created.billingId)).get()
    ).toMatchObject({
      customerId: customer.id,
      amountDue: 10000
    });
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(10000);

    const sync = await postTxn(
      app,
      `/api/sales/${created.billingId}/sync`,
      salePayload(customer.id, { addToAccounting: false })
    );
    expect(sync.status).toBe(200);
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.saleId, created.billingId)).all()
    ).toEqual([]);
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(0);
  });

  it("rejects accounting for the default customer atomically", async () => {
    const customer = await seedCustomer(db, { name: "DEFAULT" });
    const response = await postTxn(
      app,
      "/api/sales/create",
      salePayload(customer.id, { addToAccounting: true })
    );

    expect(response.status).toBe(400);
    expect(db.select().from(sales).all()).toEqual([]);
    expect(db.select().from(saleItems).all()).toEqual([]);
    expect(db.select().from(customerLedger).all()).toEqual([]);
  });
});
