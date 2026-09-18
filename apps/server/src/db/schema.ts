import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const sessions = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const accounts = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId)
  ]
);

export const verifications = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const dailyEntries = sqliteTable(
  "daily_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("entry_date").notNull(),
    cashAmount: integer("cash_amount").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    uniqueIndex("daily_entries_user_date_unique").on(table.userId, table.date),
    check("daily_entries_cash_nonnegative", sql`${table.cashAmount} >= 0`)
  ]
);

export const paymentMethods = sqliteTable(
  "payment_methods",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    uniqueIndex("payment_methods_user_name_unique").on(
      table.userId,
      sql`${table.name} COLLATE NOCASE`
    )
  ]
);

export const dailyPaymentTotals = sqliteTable(
  "daily_payment_totals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("entry_date").notNull(),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull()
  },
  (table) => [
    uniqueIndex("daily_payment_totals_method_unique").on(
      table.userId,
      table.date,
      table.paymentMethodId
    ),
    check("daily_payment_totals_positive", sql`${table.amount} > 0`)
  ]
);

export const vendorPayments = sqliteTable(
  "vendor_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("entry_date").notNull(),
    vendorName: text("vendor_name").notNull(),
    amount: integer("amount").notNull(),
    note: text("note"),
    createdAt: text("created_at").notNull()
  },
  (table) => [
    index("vendor_payments_user_date_idx").on(table.userId, table.date, table.id),
    check("vendor_payments_positive", sql`${table.amount} > 0`)
  ]
);

export const receivedEntries = sqliteTable(
  "received_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("entry_date").notNull(),
    paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id, {
      onDelete: "restrict"
    }),
    amount: integer("amount").notNull(),
    note: text("note"),
    createdAt: text("created_at").notNull()
  },
  (table) => [
    index("received_entries_user_method_idx").on(
      table.userId,
      table.date,
      table.paymentMethodId,
      table.id
    ),
    check("received_entries_positive", sql`${table.amount} > 0`)
  ]
);
