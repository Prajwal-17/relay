import Database from "better-sqlite3";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSACTION_TYPE, type TxnPayloadData } from "../../shared/types";
import * as schema from "../db/schema";
import { customers, products, saleItems, sales } from "../db/schema";
import { salesService } from "../modules/sales/sales.service";
import { seedInitialData } from "./helpers";

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

describe("testing update sale feature", () => {
  let db: BetterSQLite3Database<typeof schema>;
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

  it("update sale with id(item.id | saleItem.id) for each item and productId exists", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      customerName: initialData.customer.name,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          parentId: initialData.sale.id,
          rowId: crypto.randomUUID(),
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
          parentId: initialData.sale.id,
          rowId: crypto.randomUUID(),
          quantity: 4,
          checkedQty: 4,
          isInventoryItem: false
        }
      ]
    };

    await salesService.updateSale(initialData.sale.id, payload);

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

    expect(item1?.mrp).toBe(8000);
    expect(item1?.price).toBe(7000);
    expect(item1?.purchasePrice).toBe(6500);
    expect(item1?.totalPrice).toBe(35000);
    expect(item1?.quantity).toBe(5);
    expect(item1?.checkedQty).toBe(5);

    expect(item2?.checkedQty).toBe(4);

    expect(allSaleitems.length).toBe(2);
  });

  it("update sale with id(item.id | saleItem.id) for each item and productId=null", async () => {
    const initialData = await seedInitialData(db);

    const payload: TxnPayloadData = {
      transactionNo: initialData.sale.invoiceNo,
      transactionType: TRANSACTION_TYPE.SALE,
      customerId: initialData.customer.id,
      customerName: initialData.customer.name,
      isPaid: true,
      items: [
        {
          ...initialData.saleItem1,
          parentId: initialData.sale.id,
          productId: null,
          name: "Test Product 1",
          productSnapshot: "Test Product 1 2Kg Mrp=123Rs",
          rowId: crypto.randomUUID(),
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
          parentId: initialData.sale.id,
          rowId: crypto.randomUUID(),
          quantity: 4,
          checkedQty: 4,
          isInventoryItem: false
        }
      ]
    };

    await salesService.updateSale(initialData.sale.id, payload);

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

    expect(allSaleitems.length).toBe(2);
  });
});
