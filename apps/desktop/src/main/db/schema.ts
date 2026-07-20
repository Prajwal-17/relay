import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";
import type { AppConfig } from "../../shared/types";
import type { CustomerRole } from "./enum";

export const appInstance = sqliteTable("app_instance", {
  id: text("id").primaryKey(), // prevent multiple entries
  os: text("os"),
  installedAt: text("installed_at"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const storeProfile = sqliteTable("store_profile", {
  id: text("id").primaryKey(), // prevent multiple entries - ensure only one store per app
  storeName: text("store_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  country: text("country").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  city: text("city").notNull(),
  gstin: text("gstin"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    storeId: text("store_id").references(() => storeProfile.id, {
      onDelete: "cascade"
    }),
    name: text("name").notNull().unique(),
    contact: text("contact"),
    customerType: text("customer_type").$type<CustomerRole>().notNull(),
    notes: text("notes"),
    address: text("address"),
    outstandingBalance: integer("outstanding_balance", { mode: "number" }).default(0),
    creditLimit: integer("credit_limit", { mode: "number" }).default(0),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    archivedAt: text("archived_at"),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [index("customer_store_id_idx").on(table.storeId)]
);

export const customerLedger = sqliteTable("customer_ledger", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  storeId: text("store_id").references(() => storeProfile.id, {
    onDelete: "cascade"
  }),
  type: text("type").notNull(),
  saleId: text("sale_id").references(() => sales.id),
  amountDue: integer("amount_due").default(0),
  amountPaid: integer("amount_paid").default(0),
  paymentMode: text("payment_mode"),
  notes: text("notes"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const products = sqliteTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    storeId: text("store_id").references(() => storeProfile.id, {
      onDelete: "cascade"
    }),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    productSnapshot: text("product_snapshot").notNull(),
    weight: text("weight"),
    unit: text("unit"),
    mrp: integer("mrp"),
    price: integer("price").notNull(),
    purchasePrice: integer("purchase_price"),
    totalQuantitySold: integer("total_quantity_sold").default(0),
    isDisabled: integer("is_disabled", { mode: "boolean" }).notNull().default(false),
    disabledAt: text("disabled_at"),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    deletedAt: text("deleted_at"),
    lastSoldAt: text("last_sold_at"),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [
    index("product_store_id_idx").on(table.storeId),
    index("product_snapshot_idx").on(table.productSnapshot)
  ]
);

export const productHistory = sqliteTable("product_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  weight: text("weight"),
  unit: text("unit"),
  productId: text("product_id")
    .references(() => products.id, {
      onDelete: "cascade"
    })
    .notNull(),
  oldPrice: integer("old_price"),
  newPrice: integer("new_price"),
  oldMrp: integer("old_mrp"),
  newMrp: integer("new_mrp"),
  oldPurchasePrice: integer("old_purchase_price"),
  newPurchasePrice: integer("new_purchase_price"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const sales = sqliteTable(
  "sales",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    storeId: text("store_id").references(() => storeProfile.id, {
      onDelete: "cascade"
    }),
    invoiceNo: integer("invoice_no").notNull().unique(),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    grandTotal: integer("grand_total", { mode: "number" }),
    totalQuantity: integer("total_quantity", { mode: "number" }),
    amountPaid: integer("amount_paid", { mode: "number" }).default(0).notNull(),
    paymentMode: text("payment_mode"),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
    notes: text("notes"),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [
    index("sales_id_idx").on(table.id),
    index("sales_customer_id_idx").on(table.customerId)
  ]
);

export const saleItems = sqliteTable(
  "sale_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    saleId: text("sale_id")
      .references(() => sales.id, { onDelete: "cascade" })
      .notNull(),
    productId: text("product_id").references(() => products.id),
    name: text("name").notNull(),
    productSnapshot: text("product_snapshot").notNull(),
    mrp: integer("mrp"),
    price: integer("price").notNull(),
    purchasePrice: integer("purchase_price"),
    weight: text("weight"),
    unit: text("unit"),
    quantity: integer("quantity").notNull(),
    totalPrice: integer("total_price").notNull(),
    checkedQty: integer("checked_qty").default(0),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [
    index("sale_items_id_idx").on(table.id),
    index("sale_items_sale_id_idx").on(table.saleId),
    index("sale_items_product_id_idx").on(table.productId),
    index("sale_items_position_idx").on(table.saleId, table.position)
  ]
);

export const estimates = sqliteTable(
  "estimates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    storeId: text("store_id").references(() => storeProfile.id, {
      onDelete: "cascade"
    }),
    estimateNo: integer("estimate_no").notNull().unique(),
    customerId: text("customer_id")
      .references(() => customers.id)
      .notNull(),
    grandTotal: integer("grand_total", { mode: "number" }),
    totalQuantity: integer("total_quantity", { mode: "number" }),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
    notes: text("notes"),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [
    index("estimates_id_idx").on(table.id),
    index("estimates_customer_id_idx").on(table.customerId)
  ]
);

export const estimateItems = sqliteTable(
  "estimate_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    estimateId: text("estimate_id")
      .references(() => estimates.id, { onDelete: "cascade" })
      .notNull(),
    productId: text("product_id").references(() => products.id),
    name: text("name").notNull(),
    productSnapshot: text("product_snapshot").notNull(),
    mrp: integer("mrp"),
    price: integer("price").notNull(),
    purchasePrice: integer("purchase_price"),
    weight: text("weight"),
    unit: text("unit"),
    quantity: integer("quantity").notNull(),
    totalPrice: integer("total_price").notNull(),
    checkedQty: integer("checked_qty").default(0),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  },
  (table) => [
    index("estimate_items_id_idx").on(table.id),
    index("estimate_items_estimate_id_idx").on(table.estimateId),
    index("estimate_items_product_id_idx").on(table.productId),
    index("estimate_items_position_idx").on(table.estimateId, table.position)
  ]
);

export const appPreferences = sqliteTable("app_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  storeId: text("store_id").references(() => storeProfile.id),
  config: text("config", { mode: "json" }).$type<AppConfig>().notNull(),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

// drizzle relations are only for querying
export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id]
  }),
  saleItems: many(saleItems),
  customerLedgerEntries: many(customerLedger)
}));

export const customerLedgerRelations = relations(customerLedger, ({ one }) => ({
  customer: one(customers, {
    fields: [customerLedger.customerId],
    references: [customers.id]
  }),
  sale: one(sales, {
    fields: [customerLedger.saleId],
    references: [sales.id]
  }),
  storeProfile: one(storeProfile, {
    fields: [customerLedger.storeId],
    references: [storeProfile.id]
  })
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id]
  })
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id]
  }),
  estimateItems: many(estimateItems)
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id]
  })
}));
