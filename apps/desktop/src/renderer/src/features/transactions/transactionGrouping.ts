import type { TransactionListResponse } from "@shared/types";

export type TransactionGroupBy = "none" | "day" | "month";

type TransactionListItem = TransactionListResponse["transactions"][number];

export type TransactionDisplayRow =
  | {
      kind: "group";
      key: string;
      label: string;
    }
  | {
      kind: "transaction";
      key: string;
      transaction: TransactionListItem;
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

export const buildTransactionDisplayRows = (
  transactions: TransactionListItem[],
  groupBy: TransactionGroupBy
): TransactionDisplayRow[] => {
  if (groupBy === "none") {
    return transactions.map((transaction) => ({
      kind: "transaction",
      key: `transaction:${transaction.id}`,
      transaction
    }));
  }

  const rows: TransactionDisplayRow[] = [];
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
