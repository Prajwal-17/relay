import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TRANSACTION_TYPE, type SyncResponse, type TxnPayloadData } from "../../shared/types";
import { products, saleItems, sales } from "../db/schema";
import {
  dbMock,
  cleanupDb,
  createTestApp,
  createTestDb,
  existingCustomRowId,
  postTxn,
  rowId1,
  rowId2,
  rowId3,
  rowId4,
  seedCustomer,
  seedInitialData,
  seedProduct,
  type DB
} from "./helpers";

// ----------------
// Compile better-sqlite3 `pnpm run rebuild:node` before running this test
// ----------------

describe("sales endpoint integration tests", () => {
  let app: ReturnType<typeof createTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createTestApp();
  });

  afterEach(() => {
    if (db) {
      cleanupDb(db);
    }
    sqlite?.close();
  });

  it("POST /api/sales/create persists the sale, its items, and product sold quantities", async () => {
    const customer = await seedCustomer(db);
    const product1 = await seedProduct(db, {
      name: "Amul Gold Milk 1L",
      productSnapshot: "Amul Gold Full Cream Milk 1 Liter pouch",
      totalQuantitySold: 30000,
      mrp: 7200,
      price: 6800,
      purchasePrice: 6000,
      weight: "1",
      unit: "Litre"
    });
    const product2 = await seedProduct(db, {
      name: "Parle-G Glucose Biscuits",
      productSnapshot: "Parle-G 800g pack",
      totalQuantitySold: 20000,
      mrp: 8500,
      price: 8000,
      purchasePrice: 6800,
      weight: "800",
      unit: "g"
    });

    const createdAt = "2026-04-27T10:15:30.000Z";
    const payload: TxnPayloadData = {
      transactionNo: 101,
      transactionType: TRANSACTION_TYPE.SALE,
      addToAccounting: false,
      customerId: customer.id,
      notes: null,
      createdAt,
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
          position: 0,
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
          position: 1,
          isDeleted: false
        },
        {
          id: null,
          rowId: rowId3,
          productId: null,
          name: "Maggi 2-Minute Noodles",
          productSnapshot: "Maggi Masala 70g pouch",
          mrp: 1400,
          price: 1300,
          weight: "70",
          unit: "g",
          quantity: 45000,
          checkedQty: 45,
          position: 2,
          isDeleted: false
        }
      ]
    };

    const response = await postTxn(app, "/api/sales/create", payload);
    const body = (await response.json()) as SyncResponse;

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.billingId).toBeTruthy();
    expect(body.deletedRowIds).toEqual([]);
    expect(body.syncedItems.map((item) => item.rowId)).toEqual([rowId1, rowId2, rowId3]);

    const createdSale = db.select().from(sales).where(eq(sales.id, body.billingId!)).get();
    const createdItems = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, body.billingId!))
      .all();
    const savedProduct1 = db.select().from(products).where(eq(products.id, product1.id)).get();
    const savedProduct2 = db.select().from(products).where(eq(products.id, product2.id)).get();

    expect(createdSale).toMatchObject({
      invoiceNo: 101,
      customerId: customer.id,
      createdAt,
      grandTotal: 146100,
      totalQuantity: 57000
    });
    expect(createdItems).toHaveLength(3);
    expect(createdItems.map((item) => item.totalPrice)).toEqual(
      expect.arrayContaining([47600, 40000, 58500])
    );
    expect(savedProduct1?.totalQuantitySold).toBe(37000);
    expect(savedProduct2?.totalQuantitySold).toBe(25000);
  });

  it("POST /api/sales/:id/sync updates, adds, and deletes items while keeping sale totals and product quantities correct", async () => {
    const initialData = await seedInitialData(db);
    const createdAt = "2026-04-28T08:00:00.000Z";

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      addToAccounting: false,
      customerId: initialData.customer.id,
      notes: null,
      createdAt,
      items: [
        {
          id: initialData.saleItem1.id,
          rowId: rowId1,
          productId: initialData.product1.id,
          name: initialData.saleItem1.name,
          productSnapshot: initialData.saleItem1.productSnapshot,
          mrp: initialData.saleItem1.mrp,
          price: initialData.saleItem1.price,
          weight: initialData.saleItem1.weight,
          unit: initialData.saleItem1.unit,
          quantity: 9000,
          checkedQty: 9,
          position: 0,
          isDeleted: false
        },
        {
          id: initialData.saleItem2.id,
          rowId: rowId2,
          productId: initialData.product2.id,
          name: initialData.saleItem2.name,
          productSnapshot: initialData.saleItem2.productSnapshot,
          mrp: initialData.saleItem2.mrp,
          price: initialData.saleItem2.price,
          weight: initialData.saleItem2.weight,
          unit: initialData.saleItem2.unit,
          quantity: initialData.saleItem2.quantity,
          checkedQty: initialData.saleItem2.checkedQty,
          position: 1,
          isDeleted: true
        },
        {
          id: initialData.saleItem3.id,
          rowId: existingCustomRowId,
          productId: null,
          name: initialData.saleItem3.name,
          productSnapshot: initialData.saleItem3.productSnapshot,
          mrp: initialData.saleItem3.mrp,
          price: initialData.saleItem3.price,
          weight: initialData.saleItem3.weight,
          unit: initialData.saleItem3.unit,
          quantity: 30000,
          checkedQty: 30,
          position: 2,
          isDeleted: false
        },
        {
          id: null,
          rowId: rowId4,
          productId: initialData.product2.id,
          name: "Parle-G Family Pack",
          productSnapshot: "Parle-G 800g pack",
          mrp: 8500,
          price: 7800,
          weight: "800",
          unit: "g",
          quantity: 3000,
          checkedQty: 3,
          position: 3,
          isDeleted: false
        }
      ]
    };

    const response = await postTxn(app, `/api/sales/${initialData.sale.id}/sync`, payload);
    const body = (await response.json()) as SyncResponse;

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.deletedRowIds).toEqual([rowId2]);
    expect(body.syncedItems.map((item) => item.rowId)).toEqual(
      expect.arrayContaining([rowId1, existingCustomRowId, rowId4])
    );

    const updatedSale = db.select().from(sales).where(eq(sales.id, initialData.sale.id)).get();
    const remainingItems = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, initialData.sale.id))
      .all();
    const deletedItem = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.id, initialData.saleItem2.id))
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

    expect(updatedSale).toMatchObject({
      customerId: initialData.customer.id,
      createdAt,
      grandTotal: 123600,
      totalQuantity: 42000
    });
    expect(remainingItems).toHaveLength(3);
    expect(deletedItem).toBeUndefined();
    expect(savedProduct1?.totalQuantitySold).toBe(39000);
    expect(savedProduct2?.totalQuantitySold).toBe(23000);
  });
});
