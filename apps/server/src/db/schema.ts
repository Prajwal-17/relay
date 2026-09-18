import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

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
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("entry_date").notNull(),
    cashPaisa: integer("cash_paisa").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.date] }),
    check("daily_entries_cash_nonnegative", sql`${table.cashPaisa} >= 0`)
  ]
);

export const onlineChannels = sqliteTable(
  "online_channels",
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
    uniqueIndex("online_channels_user_name_unique").on(
      table.userId,
      sql`${table.name} COLLATE NOCASE`
    ),
    uniqueIndex("online_channels_user_id_id_unique").on(table.userId, table.id)
  ]
);

export const dailyOnlineReceipts = sqliteTable(
  "daily_online_receipts",
  {
    userId: text("user_id").notNull(),
    date: text("entry_date").notNull(),
    channelId: integer("channel_id").notNull(),
    amountPaisa: integer("amount_paisa").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.date, table.channelId] }),
    foreignKey({
      columns: [table.userId, table.date],
      foreignColumns: [dailyEntries.userId, dailyEntries.date],
      name: "daily_online_receipts_entry_fk"
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId, table.channelId],
      foreignColumns: [onlineChannels.userId, onlineChannels.id],
      name: "daily_online_receipts_channel_fk"
    }).onDelete("restrict"),
    check("daily_online_receipts_positive", sql`${table.amountPaisa} > 0`)
  ]
);

export const supplierPayments = sqliteTable(
  "supplier_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    date: text("entry_date").notNull(),
    payee: text("payee").notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    note: text("note"),
    position: integer("position").notNull().default(0)
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.date],
      foreignColumns: [dailyEntries.userId, dailyEntries.date],
      name: "supplier_payments_entry_fk"
    }).onDelete("cascade"),
    index("supplier_payments_user_date_idx").on(table.userId, table.date, table.position),
    check("supplier_payments_positive", sql`${table.amountPaisa} > 0`)
  ]
);

export const receiptEvents = sqliteTable(
  "receipt_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    date: text("entry_date").notNull(),
    channelId: integer("channel_id"),
    kind: text("kind", { enum: ["opening", "payment", "adjustment"] }).notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    balancePaisa: integer("balance_paisa").notNull(),
    recordedAt: text("recorded_at"),
    name: text("name")
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.date],
      foreignColumns: [dailyEntries.userId, dailyEntries.date],
      name: "receipt_events_entry_fk"
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId, table.channelId],
      foreignColumns: [onlineChannels.userId, onlineChannels.id],
      name: "receipt_events_channel_fk"
    }).onDelete("restrict"),
    index("receipt_events_user_method_idx").on(table.userId, table.date, table.channelId, table.id),
    check("receipt_events_nonzero", sql`${table.amountPaisa} <> 0`),
    check("receipt_events_balance_nonnegative", sql`${table.balancePaisa} >= 0`),
    check("receipt_events_kind", sql`${table.kind} IN ('opening', 'payment', 'adjustment')`),
    check(
      "receipt_events_timestamp",
      sql`(${table.kind} = 'opening' AND ${table.recordedAt} IS NULL) OR (${table.kind} <> 'opening' AND ${table.recordedAt} IS NOT NULL)`
    )
  ]
);
