import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

import type { LocalDate } from "@/types/date.types";

export const dailyEntries = sqliteTable(
  "daily_entries",
  {
    date: text("entry_date").$type<LocalDate>().primaryKey().notNull(),
    cashPaisa: integer("cash_paisa").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [check("cash_nonnegative", sql`${table.cashPaisa} >= 0`)]
);

export const onlineChannels = sqliteTable(
  "online_channels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [uniqueIndex("online_channels_name_unique").on(sql`${table.name} COLLATE NOCASE`)]
);

export const dailyOnlineReceipts = sqliteTable(
  "daily_online_receipts",
  {
    date: text("entry_date")
      .$type<LocalDate>()
      .notNull()
      .references(() => dailyEntries.date, { onDelete: "cascade" }),
    channelId: integer("channel_id")
      .notNull()
      .references(() => onlineChannels.id, { onDelete: "restrict" }),
    amountPaisa: integer("amount_paisa").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.date, table.channelId] }),
    check("receipt_positive", sql`${table.amountPaisa} > 0`)
  ]
);

export const supplierPayments = sqliteTable(
  "supplier_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("entry_date")
      .$type<LocalDate>()
      .notNull()
      .references(() => dailyEntries.date, { onDelete: "cascade" }),
    payee: text("payee").notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    note: text("note"),
    position: integer("position").notNull().default(0)
  },
  (table) => [
    index("supplier_payments_entry_date_idx").on(table.date, table.position),
    check("supplier_positive", sql`${table.amountPaisa} > 0`)
  ]
);

export const receiptEvents = sqliteTable(
  "receipt_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("entry_date")
      .$type<LocalDate>()
      .notNull()
      .references(() => dailyEntries.date, { onDelete: "cascade" }),
    channelId: integer("channel_id").references(() => onlineChannels.id, {
      onDelete: "restrict"
    }),
    kind: text("kind", { enum: ["opening", "payment", "adjustment"] }).notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    balancePaisa: integer("balance_paisa").notNull(),
    recordedAt: text("recorded_at"),
    name: text("name")
  },
  (table) => [
    index("receipt_events_method_idx").on(table.date, table.channelId, table.id),
    check("event_nonzero", sql`${table.amountPaisa} <> 0`),
    check("event_balance_nonnegative", sql`${table.balancePaisa} >= 0`),
    check("event_kind", sql`${table.kind} IN ('opening', 'payment', 'adjustment')`),
    check(
      "event_timestamp",
      sql`(${table.kind} = 'opening' AND ${table.recordedAt} IS NULL) OR (${table.kind} <> 'opening' AND ${table.recordedAt} IS NOT NULL)`
    )
  ]
);
