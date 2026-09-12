import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estimateItems, estimates, products, saleItems, sales } from "../../../db/schema";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  getJson,
  postTxn,
  readJson,
  requestJson,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  transactionItem,
  type DB
} from "../../helpers";

describe("estimates lifecycle integration", () => {
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

  it("updates individual and batch checked quantities in milli-units", async () => {
    const customer = await seedCustomer(db);
    const estimate = await seedEstimate(db, { estimateNo: 50, customerId: customer.id });
    const first = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      quantity: 3000,
      checkedQty: 0
    });
    await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      quantity: 2000,
      checkedQty: 0
    });

    const increment = await requestJson(
      app,
      "POST",
      `/api/estimates/${estimate.id}/items/${first.id}/checked-qty`,
      { action: "inc" }
    );
    expect(increment.status).toBe(204);
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.id, first.id)).get()?.checkedQty
    ).toBe(1000);

    await requestJson(app, "POST", `/api/estimates/${estimate.id}/items/${first.id}/checked-qty`, {
      action: "set"
    });
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.id, first.id)).get()?.checkedQty
    ).toBe(3000);

    expect(
      (
        await requestJson(app, "POST", `/api/estimates/${estimate.id}/items/checked-qty/batch`, {
          action: "mark_all"
        })
      ).status
    ).toBe(204);
    expect(
      db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, estimate.id))
        .all()
        .map((item) => item.checkedQty)
    ).toEqual([3000, 2000]);

    await requestJson(app, "POST", `/api/estimates/${estimate.id}/items/checked-qty/batch`, {
      action: "unmark_all"
    });
    expect(
      db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, estimate.id))
        .all()
        .map((item) => item.checkedQty)
    ).toEqual([0, 0]);
  });

  it("rejects invalid checked-quantity operations without changing rows", async () => {
    const customer = await seedCustomer(db);
    const estimate = await seedEstimate(db, { estimateNo: 51, customerId: customer.id });
    const item = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      checkedQty: 1000
    });

    expect(
      (
        await requestJson(
          app,
          "POST",
          `/api/estimates/${estimate.id}/items/${item.id}/checked-qty`,
          { action: "all" }
        )
      ).status
    ).toBe(400);
    expect(
      (
        await requestJson(
          app,
          "POST",
          `/api/estimates/${estimate.id}/items/${crypto.randomUUID()}/checked-qty`,
          { action: "inc" }
        )
      ).status
    ).toBe(400);
    expect(
      (
        await requestJson(
          app,
          "POST",
          `/api/estimates/${crypto.randomUUID()}/items/checked-qty/batch`,
          { action: "mark_all" }
        )
      ).status
    ).toBe(404);
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.id, item.id)).get()?.checkedQty
    ).toBe(1000);
  });

  it("duplicates an estimate with reset checked quantities and adjusted product totals", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 2000 });
    const estimate = await seedEstimate(db, {
      estimateNo: 60,
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      notes: "copy me"
    });
    const originalItem = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: product.id,
      quantity: 2000,
      checkedQty: 2000,
      totalPrice: 20000
    });

    const response = await requestJson(app, "POST", `/api/estimates/${estimate.id}/duplicate`);
    const body = await readJson<{ id: string; estimateNo: number }>(response);

    expect(response.status).toBe(200);
    expect(body.estimateNo).toBe(61);
    const duplicateItems = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, body.id))
      .all();
    expect(duplicateItems).toHaveLength(1);
    expect(duplicateItems[0]).toMatchObject({ productId: product.id, checkedQty: 0 });
    expect(duplicateItems[0]?.id).not.toBe(originalItem.id);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(4000);
  });

  it("converts an estimate into a sale and preserves its stored item data", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 2000 });
    const estimate = await seedEstimate(db, {
      estimateNo: 70,
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      notes: "convert me"
    });
    await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: product.id,
      name: "Stored Name",
      productSnapshot: "Stored Snapshot",
      quantity: 2000,
      checkedQty: 1000,
      totalPrice: 20000,
      position: 3
    });

    const response = await requestJson(app, "POST", `/api/estimates/${estimate.id}/convert`);
    const body = await readJson<{ id: string }>(response);

    expect(response.status).toBe(200);
    expect(db.select().from(estimates).where(eq(estimates.id, estimate.id)).get()).toBeUndefined();
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimate.id)).all()
    ).toEqual([]);
    expect(db.select().from(sales).where(eq(sales.id, body.id)).get()).toMatchObject({
      invoiceNo: 1,
      customerId: customer.id,
      grandTotal: 20000,
      totalQuantity: 2000,
      notes: "convert me"
    });
    expect(db.select().from(saleItems).where(eq(saleItems.saleId, body.id)).get()).toMatchObject({
      productId: product.id,
      name: "Stored Name",
      productSnapshot: "Stored Snapshot",
      checkedQty: 1000,
      position: 3
    });
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(2000);
  });

  it("soft deletes an estimate, reverses product totals once, and blocks further access", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 5000 });
    const estimate = await seedEstimate(db, { estimateNo: 80, customerId: customer.id });
    const item = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: product.id,
      quantity: 2000
    });

    const response = await requestJson(app, "DELETE", `/api/estimates/${estimate.id}`);

    expect(response.status).toBe(204);
    expect(db.select().from(estimates).where(eq(estimates.id, estimate.id)).get()).toMatchObject({
      isDeleted: true
    });
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimate.id)).all()
    ).toEqual([expect.objectContaining({ id: item.id })]);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(3000);

    expect((await getJson(app, `/api/estimates/${estimate.id}`)).status).toBe(400);
    expect((await requestJson(app, "DELETE", `/api/estimates/${estimate.id}`)).status).toBe(400);
    expect(
      (await postTxn(app, `/api/estimates/${estimate.id}/sync`, estimatePayload(customer.id)))
        .status
    ).toBe(404);
    expect((await requestJson(app, "POST", `/api/estimates/${estimate.id}/duplicate`)).status).toBe(
      404
    );
    expect((await requestJson(app, "POST", `/api/estimates/${estimate.id}/convert`)).status).toBe(
      400
    );
    expect(
      (
        await requestJson(
          app,
          "POST",
          `/api/estimates/${estimate.id}/items/${item.id}/checked-qty`,
          {
            action: "inc"
          }
        )
      ).status
    ).toBe(400);
    expect(
      (
        await requestJson(app, "POST", `/api/estimates/${estimate.id}/items/checked-qty/batch`, {
          action: "mark_all"
        })
      ).status
    ).toBe(404);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(3000);

    const activeEstimate = await seedEstimate(db, { estimateNo: 81, customerId: customer.id });
    const activeItem = await seedEstimateItem(db, {
      estimateId: activeEstimate.id,
      productId: null,
      checkedQty: 0
    });
    const crossEstimateResponse = await requestJson(
      app,
      "POST",
      `/api/estimates/${estimate.id}/items/${activeItem.id}/checked-qty`,
      { action: "inc" }
    );
    expect(crossEstimateResponse.status).toBe(400);
    expect(
      db.select().from(estimateItems).where(eq(estimateItems.id, activeItem.id)).get()?.checkedQty
    ).toBe(0);
  });

  it("moves product totals when sync changes an item's product", async () => {
    const customer = await seedCustomer(db);
    const oldProduct = await seedProduct(db, { name: "Old", totalQuantitySold: 5000 });
    const newProduct = await seedProduct(db, { name: "New", totalQuantitySold: 1000 });
    const estimate = await seedEstimate(db, { estimateNo: 90, customerId: customer.id });
    const item = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: oldProduct.id,
      quantity: 2000,
      totalPrice: 20000
    });

    const response = await postTxn(
      app,
      `/api/estimates/${estimate.id}/sync`,
      estimatePayload(customer.id, {
        items: [
          transactionItem({
            id: item.id,
            productId: newProduct.id,
            quantity: 3000,
            rowId: crypto.randomUUID()
          })
        ]
      })
    );

    expect(response.status).toBe(200);
    expect(
      db.select().from(products).where(eq(products.id, oldProduct.id)).get()?.totalQuantitySold
    ).toBe(3000);
    expect(
      db.select().from(products).where(eq(products.id, newProduct.id)).get()?.totalQuantitySold
    ).toBe(4000);
  });

  it("returns failures for invalid or missing lifecycle IDs without creating rows", async () => {
    expect((await requestJson(app, "POST", "/api/estimates/not-a-uuid/duplicate")).status).toBe(
      400
    );
    expect(
      (await requestJson(app, "POST", `/api/estimates/${crypto.randomUUID()}/duplicate`)).status
    ).toBe(404);
    expect(
      (await requestJson(app, "POST", `/api/estimates/${crypto.randomUUID()}/convert`)).status
    ).toBe(400);
    expect((await requestJson(app, "DELETE", `/api/estimates/${crypto.randomUUID()}`)).status).toBe(
      400
    );
    expect(db.select().from(estimates).all()).toEqual([]);
    expect(db.select().from(sales).all()).toEqual([]);
  });
});
