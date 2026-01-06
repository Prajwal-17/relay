import type Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { CustomerRole } from "../../db/enum";
import * as schema from "../../db/schema";
import { customers, products, saleItems, sales } from "../../db/schema";

export type DB = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

export const rowId1 = "30f1f3db-e902-4ffb-a20c-a6e04513b36e";
export const rowId2 = "a7ff0837-22cd-4ed6-b796-fae53ef265a3";
export const rowId3 = "d2bd676b-7fda-49c5-b7fc-7e4acd86ee49";

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
    productId: string;
  } & Partial<typeof saleItems.$inferInsert>
) {
  if (!params.saleId) {
    throw new Error("seedSaleItem: saleId is required");
  }

  if (!params.productId) {
    throw new Error("seedSaleItem: productId is required");
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
    quantity: params.quantity ?? 1,
    totalPrice: params.totalPrice ?? 0,
    checkedQty: params.checkedQty ?? 0
  };

  db.insert(saleItems).values(saleItem).run();
  return saleItem;
}

export async function seedInitialData(db) {
  const customer = await seedCustomer(db);

  const product1 = await seedProduct(db, {
    name: "Amul Gold Milk 1L",
    productSnapshot: "Amul Gold Full Cream Milk 1 Liter pouch",
    weight: "1",
    unit: "Litre",
    mrp: 7200,
    price: 6800,
    purchasePrice: 6000,
    totalQuantitySold: 30
  });

  const product2 = await seedProduct(db, {
    name: "Parle-G Glucose Biscuits",
    productSnapshot: "Parle-G 800g pack",
    weight: "800",
    unit: "g",
    mrp: 8500,
    price: 8000,
    purchasePrice: 6800,
    totalQuantitySold: 20
  });

  const sale = await seedSale(db, {
    invoiceNo: 1,
    customerId: customer.id,
    grandTotal: 87600,
    totalQuantity: 12,
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
    quantity: 7,
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
    quantity: 5,
    totalPrice: 40000,
    checkedQty: 5
  });

  const saleItem3 = await seedSaleItem(db, {
    saleId: sale.id,
    productId: product2.id,
    name: "Maggi 2-Minute Noodles Masala",
    productSnapshot: "Maggi Masala 70g pouch",
    mrp: 1400,
    price: 1300,
    purchasePrice: 1100,
    weight: "70",
    unit: "g",
    quantity: 45,
    totalPrice: 58500,
    checkedQty: 45
  });

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
