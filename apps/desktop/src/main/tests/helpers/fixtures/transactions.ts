import { eq, sql } from "drizzle-orm";
import { CustomerRole } from "../../../db/enum";
import {
  customers,
  estimateItems,
  estimates,
  products,
  saleItems,
  sales
} from "../../../db/schema";
import type { DB } from "../database";
import { seedProduct } from "./products";

export const rowId1 = "30f1f3db-e902-4ffb-a20c-a6e04513b36e";
export const rowId2 = "a7ff0837-22cd-4ed6-b796-fae53ef265a3";
export const rowId3 = "d2bd676b-7fda-49c5-b7fc-7e4acd86ee49";
export const rowId4 = "bdeb6f44-f71d-42dd-8d53-2bcac3e086b3";
export const existingCustomRowId = "76db209d-c0e8-460f-a3af-f27a0d9e52d8";
export const estimateCustomRowId = "f1f93c10-3b27-4118-b0c2-3a4448776e8c";

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

export async function seedSale(db: DB, overrides: Partial<typeof sales.$inferInsert> = {}) {
  const sale = {
    id: overrides.id ?? crypto.randomUUID(),
    invoiceNo: overrides.invoiceNo ?? 1,
    customerId: overrides.customerId ?? "", //
    grandTotal: overrides.grandTotal ?? 0,
    totalQuantity: overrides.totalQuantity ?? 0,
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
    totalQuantity: 12000
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
    totalQuantity: 12000
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
