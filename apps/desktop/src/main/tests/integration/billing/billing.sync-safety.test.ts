import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SyncResponse } from "../../../../shared/types";
import { estimateItems, estimates, products, saleItems, sales } from "../../../db/schema";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  postTxn,
  readJson,
  salePayload,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  seedSale,
  seedSaleItem,
  transactionItem,
  type DB
} from "../../helpers";

describe("billing synchronization ownership and acknowledgement safety", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([
      { path: "/api/sales", controller: salesController },
      { path: "/api/estimates", controller: estimatesController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it.each([false, true])(
    "returns 409 and changes nothing when a sale sync %s a row owned by another sale",
    async (isDeleted) => {
      const customer = await seedCustomer(db);
      const product = await seedProduct(db, { totalQuantitySold: 1000 });
      const owner = await seedSale(db, { invoiceNo: 1, customerId: customer.id });
      const target = await seedSale(db, { invoiceNo: 2, customerId: customer.id });
      const foreignItem = await seedSaleItem(db, {
        saleId: owner.id,
        productId: product.id,
        quantity: 1000,
        totalPrice: 10_000
      });
      const beforeItem = {
        ...db.select().from(saleItems).where(eq(saleItems.id, foreignItem.id)).get()!
      };
      const beforeOwner = { ...db.select().from(sales).where(eq(sales.id, owner.id)).get()! };
      const beforeTarget = { ...db.select().from(sales).where(eq(sales.id, target.id)).get()! };

      const response = await postTxn(
        app,
        `/api/sales/${target.id}/sync`,
        salePayload(customer.id, {
          items: [
            transactionItem({
              id: foreignItem.id,
              rowId: crypto.randomUUID(),
              productId: product.id,
              name: "Foreign sale mutation",
              productSnapshot: "Foreign sale mutation",
              quantity: 9000,
              isDeleted
            })
          ]
        })
      );

      expect.soft(response.status).toBe(409);
      expect
        .soft(db.select().from(saleItems).where(eq(saleItems.id, foreignItem.id)).get())
        .toEqual(beforeItem);
      expect.soft(db.select().from(sales).where(eq(sales.id, owner.id)).get()).toEqual(beforeOwner);
      expect
        .soft(db.select().from(sales).where(eq(sales.id, target.id)).get())
        .toEqual(beforeTarget);
      expect
        .soft(
          db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
        )
        .toBe(1000);
    }
  );

  it.each([false, true])(
    "returns 409 and changes nothing when an estimate sync %s a row owned by another estimate",
    async (isDeleted) => {
      const customer = await seedCustomer(db);
      const product = await seedProduct(db, { totalQuantitySold: 1000 });
      const owner = await seedEstimate(db, { estimateNo: 1, customerId: customer.id });
      const target = await seedEstimate(db, { estimateNo: 2, customerId: customer.id });
      const foreignItem = await seedEstimateItem(db, {
        estimateId: owner.id,
        productId: product.id,
        quantity: 1000,
        totalPrice: 10_000
      });
      const beforeItem = {
        ...db.select().from(estimateItems).where(eq(estimateItems.id, foreignItem.id)).get()!
      };
      const beforeOwner = {
        ...db.select().from(estimates).where(eq(estimates.id, owner.id)).get()!
      };
      const beforeTarget = {
        ...db.select().from(estimates).where(eq(estimates.id, target.id)).get()!
      };

      const response = await postTxn(
        app,
        `/api/estimates/${target.id}/sync`,
        estimatePayload(customer.id, {
          items: [
            transactionItem({
              id: foreignItem.id,
              rowId: crypto.randomUUID(),
              productId: product.id,
              name: "Foreign estimate mutation",
              productSnapshot: "Foreign estimate mutation",
              quantity: 9000,
              isDeleted
            })
          ]
        })
      );

      expect.soft(response.status).toBe(409);
      expect
        .soft(db.select().from(estimateItems).where(eq(estimateItems.id, foreignItem.id)).get())
        .toEqual(beforeItem);
      expect
        .soft(db.select().from(estimates).where(eq(estimates.id, owner.id)).get())
        .toEqual(beforeOwner);
      expect
        .soft(db.select().from(estimates).where(eq(estimates.id, target.id)).get())
        .toEqual(beforeTarget);
      expect
        .soft(
          db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
        )
        .toBe(1000);
    }
  );

  it.each(["sale", "estimate"] as const)(
    "returns 404 when synchronizing a missing %s",
    async (type) => {
      const customer = await seedCustomer(db);
      const payload = type === "sale" ? salePayload(customer.id) : estimatePayload(customer.id);
      const response = await postTxn(app, `/api/${type}s/${crypto.randomUUID()}/sync`, payload);

      expect(response.status).toBe(404);
    }
  );

  it("acknowledges a repeated successful sale deletion without applying inventory twice", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 1000 });
    const sale = await seedSale(db, { invoiceNo: 1, customerId: customer.id });
    const item = await seedSaleItem(db, {
      saleId: sale.id,
      productId: product.id,
      quantity: 1000,
      totalPrice: 10_000
    });
    const rowId = crypto.randomUUID();
    const payload = salePayload(customer.id, {
      items: [
        transactionItem({
          id: item.id,
          rowId,
          productId: product.id,
          isDeleted: true
        })
      ]
    });

    const firstResponse = await postTxn(app, `/api/sales/${sale.id}/sync`, payload);
    const first = await readJson<SyncResponse>(firstResponse);
    const secondResponse = await postTxn(app, `/api/sales/${sale.id}/sync`, payload);
    const second = await readJson<SyncResponse>(secondResponse);

    expect.soft(firstResponse.status).toBe(200);
    expect.soft(secondResponse.status).toBe(200);
    expect.soft(first.deletedRowIds).toEqual([rowId]);
    expect.soft(second.deletedRowIds).toEqual([rowId]);
    expect.soft(db.select().from(saleItems).where(eq(saleItems.id, item.id)).get()).toBeUndefined();
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold)
      .toBe(0);
  });

  it("acknowledges a repeated successful estimate deletion without applying inventory twice", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 1000 });
    const estimate = await seedEstimate(db, { estimateNo: 1, customerId: customer.id });
    const item = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: product.id,
      quantity: 1000,
      totalPrice: 10_000
    });
    const rowId = crypto.randomUUID();
    const payload = estimatePayload(customer.id, {
      items: [
        transactionItem({
          id: item.id,
          rowId,
          productId: product.id,
          isDeleted: true
        })
      ]
    });

    const firstResponse = await postTxn(app, `/api/estimates/${estimate.id}/sync`, payload);
    const first = await readJson<SyncResponse>(firstResponse);
    const secondResponse = await postTxn(app, `/api/estimates/${estimate.id}/sync`, payload);
    const second = await readJson<SyncResponse>(secondResponse);

    expect.soft(firstResponse.status).toBe(200);
    expect.soft(secondResponse.status).toBe(200);
    expect.soft(first.deletedRowIds).toEqual([rowId]);
    expect.soft(second.deletedRowIds).toEqual([rowId]);
    expect
      .soft(db.select().from(estimateItems).where(eq(estimateItems.id, item.id)).get())
      .toBeUndefined();
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold)
      .toBe(0);
  });
});
