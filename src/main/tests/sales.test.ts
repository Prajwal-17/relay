import Database from "better-sqlite3";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSACTION_TYPE, type TxnPayloadData } from "../../shared/types";
import * as schema from "../db/schema";
import { customers, products, saleItems, sales } from "../db/schema";
import { productRepository } from "../modules/products/products.repository";
import { salesService } from "../modules/sales/sales.service";
import { rowId1, rowId2, rowId3, seedInitialData, type DB } from "./helpers";

dotenv.config();

const mocks = vi.hoisted(() => {
  return {
    db: { instance: null as any }
  };
});

vi.mock("../db/db", () => {
  return {
    get db() {
      return mocks.db.instance;
    }
  };
});

describe("Update Sale Feat - AutoSave + Manual", () => {
  let db: DB;
  let sqlite: Database.Database;
  beforeEach(() => {
    sqlite = new Database(":memory:");
    const testDb = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), process.env.MIGRATION_FOLDER!);
    migrate(testDb, { migrationsFolder });
    mocks.db.instance = testDb;
    db = mocks.db.instance;
  });

  afterEach(() => {
    db.delete(customers);
    db.delete(products);
    db.delete(sales);
    db.delete(saleItems);
    sqlite.close();
  });

  it("when item.id(saleItem.id) exists && productId exists for all Items (UPDATE)", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          rowId: rowId1,
          mrp: 8000,
          price: 7000,
          purchasePrice: 6500,
          weight: "1",
          unit: "Litre",
          quantity: 5,
          checkedQty: 5,
          isInventoryItem: false
        },
        {
          ...initialData.saleItem2,
          rowId: rowId2,
          quantity: 4,
          checkedQty: 4,
          isInventoryItem: false
        }
      ]
    };

    const result = await salesService.updateSale(initialData.sale.id, payload);

    const item1 = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.id, initialData.saleItem1.id))
      .get();

    const item2 = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.id, initialData.saleItem2.id))
      .get();

    const allSaleitems = db.select().from(saleItems).all();

    const product1 = await productRepository.findById(initialData.product1.id);
    const product2 = await productRepository.findById(initialData.product2.id);

    expect(result.items[0].rowId).toBe(rowId1);
    expect(result.items[1].rowId).toBe(rowId2);
    expect(item1?.mrp).toBe(8000);
    expect(item1?.price).toBe(7000);
    expect(item1?.purchasePrice).toBe(6500);
    expect(item1?.totalPrice).toBe(35000);
    expect(item1?.quantity).toBe(5);
    expect(item1?.checkedQty).toBe(5);

    expect(item2?.checkedQty).toBe(4);

    expect(product1?.totalQuantitySold).toBe(35); // 30 + 5(replace 7)
    expect(product2?.totalQuantitySold).toBe(24); // 20 + 4(replace 5)

    expect(allSaleitems.length).toBe(2);
  });

  it("when item.id(saleItem.id) exists && productId=null (UPDATE)", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          productId: null,
          name: "Test Product 1",
          productSnapshot: "Test Product 1 2Kg Mrp=123Rs",
          rowId: rowId1,
          mrp: 12300,
          price: 12000,
          purchasePrice: 11000,
          weight: "2",
          unit: "Kg",
          quantity: 6,
          checkedQty: 3,
          isInventoryItem: false
        },
        {
          ...initialData.saleItem2,
          rowId: rowId2,
          quantity: 4,
          checkedQty: 4,
          isInventoryItem: false
        }
      ]
    };

    const result = await salesService.updateSale(initialData.sale.id, payload);

    const item1 = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.id, initialData.saleItem1.id))
      .get();

    const item2 = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.id, initialData.saleItem2.id))
      .get();

    const allSaleitems = db.select().from(saleItems).all();

    const product1 = await productRepository.findById(initialData.product1.id);
    const product2 = await productRepository.findById(initialData.product2.id);

    expect(result.items[0].rowId).toBe(rowId1);
    expect(result.items[1].rowId).toBe(rowId2);

    expect(item1?.productId).toBe(null);
    expect(item1?.name).toBe("Test Product 1");
    expect(item1?.productSnapshot).toBe("Test Product 1 2Kg Mrp=123Rs");
    expect(item1?.mrp).toBe(12300);
    expect(item1?.price).toBe(12000);
    expect(item1?.purchasePrice).toBe(11000);
    expect(item1?.totalPrice).toBe(72000);
    expect(item1?.quantity).toBe(6);
    expect(item1?.checkedQty).toBe(3);

    expect(item2?.checkedQty).toBe(4);

    expect(product1?.totalQuantitySold).toBe(30); // 30 + productId=null
    expect(product2?.totalQuantitySold).toBe(24); // 20 + 4(replace 5)

    expect(allSaleitems.length).toBe(2);
  });

  it("when item.id(saleItem.id) does not exists && for both productId=null and productId exits (INSERT)", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          rowId: rowId1,
          quantity: 6,
          checkedQty: 3,
          isInventoryItem: false
        },
        {
          ...initialData.saleItem2,
          rowId: rowId2,
          quantity: 4,
          checkedQty: 4,
          isInventoryItem: false
        },
        {
          id: null,
          rowId: rowId3,
          productId: initialData.product1.id,
          name: "Amul Gold Milk 1L",
          productSnapshot: "Amul Gold Full Cream Milk 1 Liter Mrp=72rs",
          mrp: 7200,
          price: 7200,
          purchasePrice: 6000,
          weight: "1",
          unit: "Litre",
          quantity: 22,
          checkedQty: 16,
          isInventoryItem: false
        }
      ]
    };

    const result = await salesService.updateSale(initialData.sale.id, payload);

    const item3 = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.productSnapshot, "Amul Gold Full Cream Milk 1 Liter Mrp=72rs"))
      .get();

    const allSaleitems = db.select().from(saleItems).all();

    const product1 = await productRepository.findById(initialData.product1.id);
    const product2 = await productRepository.findById(initialData.product2.id);

    expect(result.items[0].rowId).toBe(rowId1);
    expect(result.items[1].rowId).toBe(rowId2);
    expect(result.items[2].rowId).toBe(rowId3);

    expect(item3?.id).toBeTruthy();
    expect(item3?.saleId).toBe(initialData.sale.id);
    expect(item3?.name).toBe("Amul Gold Milk 1L");
    expect(item3?.productSnapshot).toBe("Amul Gold Full Cream Milk 1 Liter Mrp=72rs");
    expect(item3?.mrp).toBe(7200);
    expect(item3?.price).toBe(7200);
    expect(item3?.purchasePrice).toBe(6000);
    expect(item3?.totalPrice).toBe(158400);
    expect(item3?.quantity).toBe(22);
    expect(item3?.checkedQty).toBe(16);

    expect(product1?.totalQuantitySold).toBe(58); // 30 + 6 + 22
    expect(product2?.totalQuantitySold).toBe(24); // 20 + 4

    expect(allSaleitems.length).toBe(3);
  });

  it("delete all sale Items empty [] array (DELETE)", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      isPaid: true,
      items: []
    };

    await salesService.updateSale(initialData.sale.id, payload);

    const sale = db.select().from(sales).where(eq(sales.id, initialData.sale.id)).get();

    const allSaleitems = db.select().from(saleItems).all();

    const product1 = await productRepository.findById(initialData.product1.id);
    const product2 = await productRepository.findById(initialData.product2.id);

    expect(sale?.totalQuantity).toBe(0);
    expect(sale?.grandTotal).toBe(0);

    expect(product1?.totalQuantitySold).toBe(30); // 37 - 7
    expect(product2?.totalQuantitySold).toBe(20); // 25 - 5

    expect(allSaleitems.length).toBe(0);
  });

  it("delete multiple items array (DELETE)", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          rowId: rowId1,
          quantity: 6,
          checkedQty: 3,
          isInventoryItem: false
        }
      ]
    };

    const allSaleitemsBeforeUpdate = db.select().from(saleItems).all();

    expect(allSaleitemsBeforeUpdate.length).toBe(3);

    const result = await salesService.updateSale(initialData.sale.id, payload);

    const sale = db.select().from(sales).where(eq(sales.id, initialData.sale.id)).get();

    const allSaleitems = db.select().from(saleItems).all();

    const product1 = await productRepository.findById(initialData.product1.id);
    const product2 = await productRepository.findById(initialData.product2.id);

    expect(result.items[0].rowId).toBe(rowId1);

    expect(sale?.totalQuantity).toBe(6);
    expect(sale?.grandTotal).toBe(40800);

    expect(product1?.totalQuantitySold).toBe(36);
    expect(product2?.totalQuantitySold).toBe(20);

    expect(allSaleitems.length).toBe(1);
  });
});
