import { faker } from "@faker-js/faker";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { AppConfig } from "../../shared/types";
import { CustomerRole } from "../db/enum";
import * as schema from "../db/schema";

dotenv.config();

const CUSTOMER_COUNT = 10;
const PRODUCT_COUNT = 20;
const HISTORY_PER_PRODUCT = 2;
const SALE_COUNT = 5;
const ITEMS_PER_SALE = 4;
const ESTIMATE_COUNT = 3;
const ITEMS_PER_ESTIMATE = 3;

const DB_PATH = process.env.M_VITE_DATABASE_URL;
if (!DB_PATH) {
  throw new Error("M_VITE_DATABASE_URL environment variable is not defined");
}
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🌱 Seeding test database...");

  // clear existing data
  db.delete(schema.estimateItems).run();
  db.delete(schema.estimates).run();
  db.delete(schema.saleItems).run();
  db.delete(schema.sales).run();
  db.delete(schema.productHistory).run();
  db.delete(schema.products).run();
  db.delete(schema.customers).run();
  db.delete(schema.appPreferences).run();
  db.delete(schema.storeProfile).run();
  db.delete(schema.appInstance).run();

  // app instance
  const appInstanceId = uuidv4();
  db.insert(schema.appInstance)
    .values({
      id: appInstanceId,
      os: process.platform,
      installedAt: new Date().toISOString()
    })
    .run();

  // store profile
  const storeId = "default";
  db.insert(schema.storeProfile)
    .values({
      id: storeId,
      storeName: "QuickCart Test Store",
      ownerName: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      country: "India",
      state: faker.location.state(),
      pincode: faker.location.zipCode(),
      city: faker.location.city(),
      gstin: "22AAAAA0000A1Z5"
    })
    .run();

  const defaultCustomerId = uuidv4();

  // app preferences
  const appConfig: AppConfig = {
    billing: {
      defaultCustomerId: defaultCustomerId
    },
    exports: {
      askBeforeSavingPdf: true,
      defaultPdfLocation: "/Desktop",
      defaultExportFormat: "pdf"
    }
  };
  db.insert(schema.appPreferences)
    .values({
      id: uuidv4(),
      storeId,
      config: appConfig
    })
    .run();

  // customers
  const customerIds: string[] = [];
  // Default customer
  db.insert(schema.customers)
    .values({
      id: defaultCustomerId,
      storeId,
      name: "DEFAULT",
      contact: null,
      customerType: CustomerRole.CASH
    })
    .run();
  customerIds.push(defaultCustomerId);

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const id = uuidv4();
    customerIds.push(id);
    db.insert(schema.customers)
      .values({
        id,
        storeId,
        name: faker.person.fullName(),
        contact: faker.phone.number(),
        customerType: faker.helpers.arrayElement([
          CustomerRole.CASH,
          CustomerRole.ACCOUNT,
          CustomerRole.HOTEL
        ])
      })
      .run();
  }

  // products
  const productIds: string[] = [];
  for (let i = 0; i < PRODUCT_COUNT; i++) {
    const id = uuidv4();
    productIds.push(id);
    const name = faker.commerce.productName();
    const price = faker.number.int({ min: 50, max: 5000 });
    const mrp = faker.number.int({ min: price, max: price * 2 });
    const purchasePrice = faker.number.int({ min: price * 0.4, max: price * 0.8 });
    const weight = faker.number.int({ min: 1, max: 50 }).toString();
    const unit = faker.helpers.arrayElement(["kg", "g", "litre", "piece"]);
    const productSnapshot = JSON.stringify({
      name,
      price,
      mrp,
      purchasePrice,
      weight,
      unit
    });

    db.insert(schema.products)
      .values({
        id,
        storeId,
        name,
        imageUrl: null,
        productSnapshot,
        weight,
        unit,
        mrp,
        price,
        purchasePrice,
        totalQuantitySold: 0,
        isDisabled: false,
        isDeleted: false
      })
      .run();

    // product history
    for (let h = 0; h < HISTORY_PER_PRODUCT; h++) {
      const oldPrice = faker.number.int({ min: 50, max: price - 1 });
      const newPrice = price;
      const oldMrp = faker.number.int({ min: oldPrice, max: oldPrice * 2 });
      const newMrp = mrp;
      const oldPurchase = faker.number.int({ min: oldPrice * 0.4, max: oldPrice * 0.8 });
      const newPurchase = purchasePrice;
      db.insert(schema.productHistory)
        .values({
          id: uuidv4(),
          name,
          weight,
          unit,
          productId: id,
          oldPrice,
          newPrice,
          oldMrp,
          newMrp,
          oldPurchasePrice: oldPurchase,
          newPurchasePrice: newPurchase
        })
        .run();
    }
  }

  const allProducts = db.select().from(schema.products).all();

  const getRandomProduct = () => {
    const p = faker.helpers.arrayElement(allProducts);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      purchasePrice: p.purchasePrice ?? 0,
      weight: p.weight ?? "",
      unit: p.unit ?? "piece",
      productSnapshot: p.productSnapshot
    };
  };

  // sales & saleItems
  let invoiceCounter = 1000;
  for (let i = 0; i < SALE_COUNT; i++) {
    const saleId = uuidv4();
    const customerId = faker.helpers.arrayElement(customerIds);
    const items: (typeof schema.saleItems.$inferInsert)[] = [];
    let grandTotal = 0;
    let totalQuantity = 0;

    for (let j = 0; j < ITEMS_PER_SALE; j++) {
      const product = getRandomProduct();
      const quantity = faker.number.int({ min: 1, max: 5 });
      const totalPrice = product.price * quantity;
      items.push({
        id: uuidv4(),
        saleId,
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        mrp: product.mrp,
        price: product.price,
        purchasePrice: product.purchasePrice,
        weight: product.weight,
        unit: product.unit,
        quantity,
        totalPrice,
        checkedQty: 0
      });
      grandTotal += totalPrice;
      totalQuantity += quantity;
    }

    db.insert(schema.sales)
      .values({
        id: saleId,
        storeId,
        invoiceNo: invoiceCounter++,
        customerId,
        grandTotal,
        totalQuantity,
        isPaid: faker.datatype.boolean()
      })
      .run();

    for (const item of items) {
      db.insert(schema.saleItems).values(item).run();
    }
  }

  // estimates & estimateItems
  let estimateCounter = 5000;
  for (let i = 0; i < ESTIMATE_COUNT; i++) {
    const estimateId = uuidv4();
    const customerId = faker.helpers.arrayElement(customerIds);
    const items: (typeof schema.estimateItems.$inferInsert)[] = [];
    let grandTotal = 0;
    let totalQuantity = 0;

    for (let j = 0; j < ITEMS_PER_ESTIMATE; j++) {
      const product = getRandomProduct();
      const quantity = faker.number.int({ min: 1, max: 5 });
      const totalPrice = product.price * quantity;
      items.push({
        id: uuidv4(),
        estimateId,
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        mrp: product.mrp,
        price: product.price,
        purchasePrice: product.purchasePrice,
        weight: product.weight,
        unit: product.unit,
        quantity,
        totalPrice,
        checkedQty: 0
      });
      grandTotal += totalPrice;
      totalQuantity += quantity;
    }

    db.insert(schema.estimates)
      .values({
        id: estimateId,
        storeId,
        estimateNo: estimateCounter++,
        customerId,
        grandTotal,
        totalQuantity,
        isPaid: faker.datatype.boolean()
      })
      .run();

    for (const item of items) {
      db.insert(schema.estimateItems).values(item).run();
    }
  }

  console.log("✅ Seeding complete!");
  console.log(`   Database: ${DB_PATH}`);
  console.log(`   Customers: ${customerIds.length}`);
  console.log(`   Products: ${productIds.length}`);
  console.log(`   Sales: ${SALE_COUNT}`);
  console.log(`   Estimates: ${ESTIMATE_COUNT}`);
}

seed()
  .catch(console.error)
  .finally(() => sqlite.close());
