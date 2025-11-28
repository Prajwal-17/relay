import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";
import type { Role } from "./enum";

export const customers = sqliteTable("customers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull().unique(),
  contact: text("contact"),
  customerType: text("customer_type").$type<Role>().notNull(),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const products = sqliteTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  productSnapshot: text("product_snapshot").notNull().default(""),
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
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

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

export const sales = sqliteTable("sales", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  invoiceNo: integer("invoice_no").notNull().unique(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  grandTotal: integer("grand_total", { mode: "number" }),
  totalQuantity: real("total_quantity"),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  saleId: text("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  productId: text("product_id").references(() => products.id),
  name: text("name").notNull(),
  productSnapshot: text("product_snapshot").notNull().default(""),
  mrp: integer("mrp"),
  price: integer("price").notNull(),
  purchasePrice: integer("purchase_price"),
  weight: text("weight"),
  unit: text("unit"),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  checkedQty: integer("checked_qty").default(0),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const drafts = sqliteTable("drafts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  type: text("type", { enum: ["sale", "estimate"] }).notNull(),
  draftNo: integer("invoice_no").notNull().unique(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  grandTotal: integer("grand_total", { mode: "number" }),
  totalQuantity: real("total_quantity"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const draftItems = sqliteTable("draft_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  draftId: text("draft_id")
    .references(() => drafts.id, { onDelete: "cascade" })
    .notNull(),
  productId: text("product_id").references(() => products.id),
  name: text("name").notNull(),
  productSnapshot: text("product_snapshot").default(""),
  mrp: integer("mrp"),
  price: integer("price"),
  purchasePrice: integer("purchase_price"),
  weight: text("weight"),
  unit: text("unit"),
  quantity: integer("quantity"),
  totalPrice: integer("total_price"),
  checkedQty: integer("checked_qty").default(0),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const estimates = sqliteTable("estimates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  estimateNo: integer("estimate_no").notNull().unique(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  grandTotal: integer("grand_total", { mode: "number" }),
  totalQuantity: real("total_quantity"),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull()
});

export const estimateItems = sqliteTable("estimate_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  estimateId: text("estimate_id")
    .references(() => estimates.id, { onDelete: "cascade" })
    .notNull(),
  productId: text("product_id").references(() => products.id),
  name: text("name").notNull(),
  productSnapshot: text("product_snapshot").notNull().default(""),
  mrp: integer("mrp"),
  price: integer("price").notNull(),
  purchasePrice: integer("purchase_price"),
  weight: text("weight"),
  unit: text("unit"),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  checkedQty: integer("checked_qty").default(0),
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
  saleItems: many(saleItems)
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
