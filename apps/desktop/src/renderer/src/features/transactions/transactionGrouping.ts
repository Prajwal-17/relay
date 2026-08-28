import type { TransactionListResponse } from "@shared/types";

export type TransactionGroupBy = "none" | "day" | "month";

export const TRANSACTION_GROUP_OPTIONS: { value: TransactionGroupBy; label: string }[] = [
  { value: "none", label: "None" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" }
];

const TRANSACTION_GROUP_BY_STORAGE_KEY = "transactions-group-by";

export const getInitialTransactionGroupBy = (): TransactionGroupBy => {
  const storedGroup = localStorage.getItem(TRANSACTION_GROUP_BY_STORAGE_KEY);
  if (storedGroup === "none" || storedGroup === "day" || storedGroup === "month") {
    return storedGroup;
  }

  localStorage.setItem(TRANSACTION_GROUP_BY_STORAGE_KEY, "day");
  return "day";
};

export const persistTransactionGroupBy = (groupBy: TransactionGroupBy) => {
  localStorage.setItem(TRANSACTION_GROUP_BY_STORAGE_KEY, groupBy);
};

type TransactionListItem = TransactionListResponse["transactions"][number];
type GroupableTransaction = { id: string; createdAt?: string };

export type TransactionDisplayRow<T extends GroupableTransaction = TransactionListItem> =
  | {
      kind: "group";
      key: string;
      label: string;
    }
  | {
      kind: "transaction";
      key: string;
      transaction: T;
    };

const IST_TIME_ZONE = "Asia/Kolkata";

const getDateParts = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((datePart) => datePart.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");

  return year && month && day ? { date, year, month, day } : null;
};

const getTransactionGroup = (
  createdAt: string | undefined,
  groupBy: Exclude<TransactionGroupBy, "none">
) => {
  const parts = createdAt ? getDateParts(createdAt) : null;
  if (!parts) return { key: "unknown", label: "Date unavailable" };

  if (groupBy === "month") {
    return {
      key: `${parts.year}-${parts.month}`,
      label: new Intl.DateTimeFormat("en-IN", {
        timeZone: IST_TIME_ZONE,
        month: "long",
        year: "numeric"
      }).format(parts.date)
    };
  }

  return {
    key: `${parts.year}-${parts.month}-${parts.day}`,
    label: new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(parts.date)
  };
};

export const buildTransactionDisplayRows = <T extends GroupableTransaction>(
  transactions: T[],
  groupBy: TransactionGroupBy
): TransactionDisplayRow<T>[] => {
  if (groupBy === "none") {
    return transactions.map((transaction) => ({
      kind: "transaction",
      key: `transaction:${transaction.id}`,
      transaction
    }));
  }

  const rows: TransactionDisplayRow<T>[] = [];
  let previousGroupKey: string | null = null;
  let groupIndex = 0;

  for (const transaction of transactions) {
    const group = getTransactionGroup(transaction.createdAt, groupBy);
    if (group.key !== previousGroupKey) {
      rows.push({
        kind: "group",
        key: `group:${group.key}:${groupIndex}`,
        label: group.label
      });
      previousGroupKey = group.key;
      groupIndex += 1;
    }

    rows.push({
      kind: "transaction",
      key: `transaction:${transaction.id}`,
      transaction
    });
  }

  return rows;
};
