import Database from "better-sqlite3";
import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import path from "node:path";
import { CustomerRole } from "../../db/enum";
import * as schema from "../../db/schema";
import { customers, estimateItems, estimates, products, saleItems, sales } from "../../db/schema";
import { estimatesController } from "../../modules/estimates/estimates.controller";
import { salesController } from "../../modules/sales/sales.controller";
import { AppError } from "../../utils/appError";

export type DB = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

export type TestDb = {
  sqlite: Database.Database;
  db: DB;
};

export const rowId1 = "30f1f3db-e902-4ffb-a20c-a6e04513b36e";
export const rowId2 = "a7ff0837-22cd-4ed6-b796-fae53ef265a3";
export const rowId3 = "d2bd676b-7fda-49c5-b7fc-7e4acd86ee49";
export const rowId4 = "bdeb6f44-f71d-42dd-8d53-2bcac3e086b3";
export const existingCustomRowId = "76db209d-c0e8-460f-a3af-f27a0d9e52d8";
export const estimateCustomRowId = "f1f93c10-3b27-4118-b0c2-3a4448776e8c";

export const dbMock = {
  instance: null as any
};

export function createTestApp() {
  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: { message: err.message } }, err.status);
    }

    if (err instanceof AppError) {
      return c.json({ error: { message: err.message } }, err.statusCode as 400 | 404 | 500);
    }

    return c.json({ error: { message: "Internal Server Error" } }, 500);
  });

  app.route("/api/sales", salesController);
  app.route("/api/estimates", estimatesController);

  return app;
}

export function createTestDb(): TestDb {
  process.env.M_VITE_MIGRATION_FOLDER ??= "drizzle";

  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), process.env.M_VITE_MIGRATION_FOLDER);
  migrate(db, { migrationsFolder });

  return { sqlite, db: db as DB };
}

export async function postTxn(app: Hono, pathname: string, payload: unknown) {
  return app.request(pathname, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ data: payload })
  });
}

export function cleanupDb(db: DB) {
  db.delete(estimateItems).run();
  db.delete(saleItems).run();
  db.delete(estimates).run();
  db.delete(sales).run();
  db.delete(products).run();
  db.delete(customers).run();
}

export async function seedCustomer(db: DB, overrides = {}) {
  const customer = {
    id: crypto.randomUUID(),
    name: "Rahul Sharma",
    contact: "9876543210",
    customerType: CustomerRole.CASH,
    ...overrides
  };

  db.insert(customers).values(customer).run();

  return customer;
}

export async function seedProduct(db: DB, overrides = {}) {
  const product = {
    id: crypto.randomUUID(),
    name: "Test Product 1",
    productSnapshot: "Test Product 1",
    weight: "1",
    unit: "pc",
    mrp: 7000,
    price: 6000,
    purchasePrice: 5000,
    totalQuantitySold: 10,
    isDisabled: false,
    disabledAt: null,
    isDeleted: false,
    deletedAt: null,
    ...overrides
  };

  db.insert(products).values(product).run();

  return product;
}

export async function seedSale(db: DB, overrides: Partial<typeof sales.$inferInsert> = {}) {
  const sale = {
    id: overrides.id ?? crypto.randomUUID(),
    invoiceNo: overrides.invoiceNo ?? 1,
    customerId: overrides.customerId ?? "", //
    grandTotal: overrides.grandTotal ?? 0,
    totalQuantity: overrides.totalQuantity ?? 0,
    isPaid: overrides.isPaid ?? false,
    createdAt: new Date().toISOString(),
    ...overrides
  };

  db.insert(sales).values(sale).run();
  return sale;
}

export async function seedSaleItem(
  db: DB,
  params: {
    saleId: string;
    productId: string | null;
  } & Partial<typeof saleItems.$inferInsert>
) {
  if (!params.saleId) {
    throw new Error("seedSaleItem: saleId is required");
  }

  const saleItem = {
    id: params.id ?? crypto.randomUUID(),
    saleId: params.saleId,
    productId: params.productId,
    name: params.name ?? "Test Item",
    productSnapshot: params.productSnapshot ?? "",
    mrp: params.mrp ?? 0,
    price: params.price ?? 0,
    purchasePrice: params.purchasePrice ?? 0,
    weight: params.weight ?? "",
    unit: params.unit ?? "",
    quantity: params.quantity ?? 1000,
    totalPrice: params.totalPrice ?? 0,
    checkedQty: params.checkedQty ?? 0
  };

  db.insert(saleItems).values(saleItem).run();
  return saleItem;
}

export async function seedEstimate(db: DB, overrides: Partial<typeof estimates.$inferInsert> = {}) {
  const estimate = {
    id: overrides.id ?? crypto.randomUUID(),
    estimateNo: overrides.estimateNo ?? 1,
    customerId: overrides.customerId ?? "",
    grandTotal: overrides.grandTotal ?? 0,
    totalQuantity: overrides.totalQuantity ?? 0,
    isPaid: overrides.isPaid ?? false,
    createdAt: new Date().toISOString(),
    ...overrides
  };

  db.insert(estimates).values(estimate).run();
  return estimate;
}

export async function seedEstimateItem(
  db: DB,
  params: {
    estimateId: string;
    productId: string | null;
  } & Partial<typeof estimateItems.$inferInsert>
) {
  if (!params.estimateId) {
    throw new Error("seedEstimateItem: estimateId is required");
  }

  const estimateItem = {
    id: params.id ?? crypto.randomUUID(),
    estimateId: params.estimateId,
    productId: params.productId,
    name: params.name ?? "Test Estimate Item",
    productSnapshot: params.productSnapshot ?? "",
    mrp: params.mrp ?? 0,
    price: params.price ?? 0,
    purchasePrice: params.purchasePrice ?? null,
    weight: params.weight ?? "",
    unit: params.unit ?? "",
    quantity: params.quantity ?? 1000,
    totalPrice: params.totalPrice ?? 0,
    checkedQty: params.checkedQty ?? 0
  };

  db.insert(estimateItems).values(estimateItem).run();
  return estimateItem;
}

export async function seedInitialData(db: DB) {
  const customer = await seedCustomer(db);

  const product1 = await seedProduct(db, {
    name: "Amul Gold Milk 1L",
    productSnapshot: "Amul Gold Full Cream Milk 1 Liter pouch",
    weight: "1",
    unit: "Litre",
    mrp: 7200,
    price: 6800,
    purchasePrice: 6000,
    totalQuantitySold: 30000
  });

  const product2 = await seedProduct(db, {
    name: "Parle-G Glucose Biscuits",
    productSnapshot: "Parle-G 800g pack",
    weight: "800",
    unit: "g",
    mrp: 8500,
    price: 8000,
    purchasePrice: 6800,
    totalQuantitySold: 20000
  });

  const sale = await seedSale(db, {
    invoiceNo: 1,
    customerId: customer.id,
    grandTotal: 87600,
    totalQuantity: 12000,
    isPaid: true
  });

  const saleItem1 = await seedSaleItem(db, {
    saleId: sale.id,
    productId: product1.id,
    name: "Amul Gold Milk 1L",
    productSnapshot: "Amul Gold Full Cream Milk 1 Liter pouch",
    mrp: 7200,
    price: 6800,
    purchasePrice: 6000,
    weight: "1",
    unit: "Litre",
    quantity: 7000,
    totalPrice: 47600,
    checkedQty: 7
  });

  const saleItem2 = await seedSaleItem(db, {
    saleId: sale.id,
    productId: product2.id,
    name: "Parle-G Glucose Biscuits",
    productSnapshot: "Parle-G 800g pack",
    mrp: 8500,
    price: 8000,
    purchasePrice: 6800,
    weight: "800",
    unit: "g",
    quantity: 5000,
    totalPrice: 40000,
    checkedQty: 5
  });

  const saleItem3 = await seedSaleItem(db, {
    saleId: sale.id,
    productId: null,
    name: "Maggi 2-Minute Noodles Masala",
    productSnapshot: "Maggi Masala 70g pouch",
    mrp: 1400,
    price: 1300,
    purchasePrice: 1100,
    weight: "70",
    unit: "g",
    quantity: 45000,
    totalPrice: 58500,
    checkedQty: 45
  });

  db.update(products)
    .set({
      totalQuantitySold: sql`${products.totalQuantitySold} + ${saleItem1.quantity}`
    })
    .where(eq(products.id, product1.id))
    .run();

  db.update(products)
    .set({
      totalQuantitySold: sql`${products.totalQuantitySold} + ${saleItem2.quantity}`
    })
    .where(eq(products.id, product2.id))
    .run();

  return {
    customer,
    product1,
    product2,
    sale,
    saleItem1,
    saleItem2,
    saleItem3
    // items: [saleItem1, saleItem2]
  };
}

export async function seedInitialEstimateData(db: DB) {
  const customer = await seedCustomer(db, { name: "Estimate Customer" });

  const product1 = await seedProduct(db, {
    name: "Estimate Milk 1L",
    productSnapshot: "Estimate Milk 1 Liter pouch",
    weight: "1",
    unit: "Litre",
    mrp: 7200,
    price: 6800,
    purchasePrice: 6000,
    totalQuantitySold: 30000
  });

  const product2 = await seedProduct(db, {
    name: "Estimate Biscuit 800g",
    productSnapshot: "Estimate Biscuit 800g pack",
    weight: "800",
    unit: "g",
    mrp: 8500,
    price: 8000,
    purchasePrice: 6800,
    totalQuantitySold: 20000
  });

  const estimate = await seedEstimate(db, {
    estimateNo: 1,
    customerId: customer.id,
    grandTotal: 87600,
    totalQuantity: 12000,
    isPaid: false
  });

  const estimateItem1 = await seedEstimateItem(db, {
    estimateId: estimate.id,
    productId: product1.id,
    name: "Estimate Milk 1L",
    productSnapshot: "Estimate Milk 1 Liter pouch",
    mrp: 7200,
    price: 6800,
    quantity: 7000,
    totalPrice: 47600,
    checkedQty: 7,
    weight: "1",
    unit: "Litre"
  });

  const estimateItem2 = await seedEstimateItem(db, {
    estimateId: estimate.id,
    productId: product2.id,
    name: "Estimate Biscuit 800g",
    productSnapshot: "Estimate Biscuit 800g pack",
    mrp: 8500,
    price: 8000,
    quantity: 5000,
    totalPrice: 40000,
    checkedQty: 5,
    weight: "800",
    unit: "g"
  });

  const estimateItem3 = await seedEstimateItem(db, {
    estimateId: estimate.id,
    productId: null,
    name: "Estimate Custom Item",
    productSnapshot: "Estimate Custom Item 70g pouch",
    mrp: 1400,
    price: 1300,
    quantity: 45000,
    totalPrice: 58500,
    checkedQty: 45,
    weight: "70",
    unit: "g"
  });

  db.update(products).set({ totalQuantitySold: 37000 }).where(eq(products.id, product1.id)).run();
  db.update(products).set({ totalQuantitySold: 25000 }).where(eq(products.id, product2.id)).run();

  return {
    customer,
    product1,
    product2,
    estimate,
    estimateItem1,
    estimateItem2,
    estimateItem3
  };
}
