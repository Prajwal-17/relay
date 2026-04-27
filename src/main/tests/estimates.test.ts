import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSACTION_TYPE, type SyncResponse, type TxnPayloadData } from "../../shared/types";
import { estimateItems, estimates, products } from "../db/schema";
import {
  cleanupDb,
  createTestApp,
  createTestDb,
  estimateCustomRowId,
  postTxn,
  rowId1,
  rowId2,
  rowId3,
  rowId4,
  seedCustomer,
  seedInitialEstimateData,
  seedProduct,
  type DB
} from "./helpers";

const mocks = vi.hoisted(() => {
  return {
    db: {
      instance: null as DB | null
    }
  };
});

vi.mock("../db/db", () => {
  return {
    get db() {
      return mocks.db.instance;
    }
  };
});

describe("estimates endpoint integration tests", () => {
  let app: ReturnType<typeof createTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    mocks.db.instance = db;
    app = createTestApp();
  });

  afterEach(() => {
    if (db) {
      cleanupDb(db);
    }
    sqlite?.close();
  });

  it("POST /api/estimates/create persists the estimate, estimate items, totals, and product sold quantities", async () => {
    const customer = await seedCustomer(db, { name: "Estimate Walk-in Customer" });
    const product1 = await seedProduct(db, {
      name: "Estimate Milk 1L",
      productSnapshot: "Estimate Milk 1 Liter pouch",
      totalQuantitySold: 30000,
      mrp: 7200,
      price: 6800,
      purchasePrice: 6000,
      weight: "1",
      unit: "Litre"
    });
    const product2 = await seedProduct(db, {
      name: "Estimate Biscuit 800g",
      productSnapshot: "Estimate Biscuit 800g pack",
      totalQuantitySold: 20000,
      mrp: 8500,
      price: 8000,
      purchasePrice: 6800,
      weight: "800",
      unit: "g"
    });

    const payload: TxnPayloadData = {
      transactionNo: 201,
      transactionType: TRANSACTION_TYPE.ESTIMATE,
      customerId: customer.id,
      isPaid: false,
      createdAt: "2026-04-27T11:45:00.000Z",
      items: [
        {
          id: null,
          rowId: rowId1,
          productId: product1.id,
          name: product1.name,
          productSnapshot: product1.productSnapshot,
          mrp: product1.mrp,
          price: product1.price,
          weight: product1.weight,
          unit: product1.unit,
          quantity: 7000,
          checkedQty: 7,
          isDeleted: false
        },
        {
          id: null,
          rowId: rowId2,
          productId: product2.id,
          name: product2.name,
          productSnapshot: product2.productSnapshot,
          mrp: product2.mrp,
          price: product2.price,
          weight: product2.weight,
          unit: product2.unit,
          quantity: 5000,
          checkedQty: 5,
          isDeleted: false
        },
        {
          id: null,
          rowId: rowId3,
          productId: null,
          name: "Estimate Custom Item",
          productSnapshot: "Estimate Custom Item 70g pouch",
          mrp: 1400,
          price: 1300,
          weight: "70",
          unit: "g",
          quantity: 45000,
          checkedQty: 45,
          isDeleted: false
        }
      ]
    };

    const response = await postTxn(app, "/api/estimates/create", payload);
    const body = (await response.json()) as SyncResponse;

    expect(response.status).toBe(200);
    expect(body.deletedRowIds).toEqual([]);
    expect(body.syncedItems.map((item) => item.rowId)).toEqual([rowId1, rowId2, rowId3]);

    const createdEstimate = db
      .select()
      .from(estimates)
      .where(eq(estimates.id, body.billingId!))
      .get();
    const createdItems = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, body.billingId!))
      .all();
    const savedProduct1 = db.select().from(products).where(eq(products.id, product1.id)).get();
    const savedProduct2 = db.select().from(products).where(eq(products.id, product2.id)).get();

    expect(createdEstimate).toMatchObject({
      estimateNo: 201,
      customerId: customer.id,
      isPaid: false,
      createdAt: "2026-04-27T11:45:00.000Z",
      grandTotal: 146100,
      totalQuantity: 57000
    });
    expect(createdItems).toHaveLength(3);
    expect(savedProduct1?.totalQuantitySold).toBe(37000);
    expect(savedProduct2?.totalQuantitySold).toBe(25000);
  });

  it("POST /api/estimates/:id/sync handles item update, add, delete, totals, and product quantity adjustments", async () => {
    const initialData = await seedInitialEstimateData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.estimate.estimateNo,
      transactionType: TRANSACTION_TYPE.ESTIMATE,
      customerId: initialData.customer.id,
      isPaid: false,
      createdAt: "2026-04-28T09:30:00.000Z",
      items: [
        {
          id: initialData.estimateItem1.id,
          rowId: rowId1,
          productId: initialData.product1.id,
          name: initialData.estimateItem1.name,
          productSnapshot: initialData.estimateItem1.productSnapshot,
          mrp: initialData.estimateItem1.mrp,
          price: initialData.estimateItem1.price,
          weight: initialData.estimateItem1.weight,
          unit: initialData.estimateItem1.unit,
          quantity: 9000,
          checkedQty: 9,
          isDeleted: false
        },
        {
          id: initialData.estimateItem2.id,
          rowId: rowId2,
          productId: initialData.product2.id,
          name: initialData.estimateItem2.name,
          productSnapshot: initialData.estimateItem2.productSnapshot,
          mrp: initialData.estimateItem2.mrp,
          price: initialData.estimateItem2.price,
          weight: initialData.estimateItem2.weight,
          unit: initialData.estimateItem2.unit,
          quantity: initialData.estimateItem2.quantity,
          checkedQty: initialData.estimateItem2.checkedQty,
          isDeleted: true
        },
        {
          id: initialData.estimateItem3.id,
          rowId: estimateCustomRowId,
          productId: null,
          name: initialData.estimateItem3.name,
          productSnapshot: initialData.estimateItem3.productSnapshot,
          mrp: initialData.estimateItem3.mrp,
          price: initialData.estimateItem3.price,
          weight: initialData.estimateItem3.weight,
          unit: initialData.estimateItem3.unit,
          quantity: 30000,
          checkedQty: 30,
          isDeleted: false
        },
        {
          id: null,
          rowId: rowId4,
          productId: initialData.product2.id,
          name: "Estimate Biscuit Refill",
          productSnapshot: "Estimate Biscuit 800g pack",
          mrp: 8500,
          price: 7800,
          weight: "800",
          unit: "g",
          quantity: 3000,
          checkedQty: 3,
          isDeleted: false
        }
      ]
    };

    const response = await postTxn(app, `/api/estimates/${initialData.estimate.id}/sync`, payload);
    const body = (await response.json()) as SyncResponse;

    expect(response.status).toBe(200);
    expect(body.deletedRowIds).toEqual([rowId2]);
    expect(body.syncedItems.map((item) => item.rowId)).toEqual(
      expect.arrayContaining([rowId1, estimateCustomRowId, rowId4])
    );

    const updatedEstimate = db
      .select()
      .from(estimates)
      .where(eq(estimates.id, initialData.estimate.id))
      .get();
    const remainingItems = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, initialData.estimate.id))
      .all();
    const deletedItem = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.id, initialData.estimateItem2.id))
      .get();
    const savedProduct1 = db
      .select()
      .from(products)
      .where(eq(products.id, initialData.product1.id))
      .get();
    const savedProduct2 = db
      .select()
      .from(products)
      .where(eq(products.id, initialData.product2.id))
      .get();

    expect(updatedEstimate).toMatchObject({
      customerId: initialData.customer.id,
      createdAt: "2026-04-28T09:30:00.000Z",
      grandTotal: 123600,
      totalQuantity: 42000
    });
    expect(remainingItems).toHaveLength(3);
    expect(deletedItem).toBeUndefined();
    expect(savedProduct1?.totalQuantitySold).toBe(39000);
    expect(savedProduct2?.totalQuantitySold).toBe(23000);
  });
});
