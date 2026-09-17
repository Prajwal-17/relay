import type { LocalDate, ReceiptEvent } from "./money.types";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric"
});
const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

function recordedDay(timestamp: string | null): string | null {
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return null;
  const parts = dayFormatter.formatToParts(new Date(timestamp));
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

function recordDate(timestamp: string | null): string {
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return "—";
  return dateFormatter.format(new Date(timestamp));
}

export function paymentTime(timestamp: string | null): string | null {
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return null;
  return timeFormatter.format(new Date(timestamp));
}

export function groupPaymentHistory(events: ReceiptEvent[], selectedDate: LocalDate | null) {
  const groups = new Map<string | null, ReceiptEvent[]>();
  for (const event of events) {
    const day = recordedDay(event.recordedAt);
    const group = groups.get(day);
    if (group) group.push(event);
    else groups.set(day, [event]);
  }
  const multipleDates = [...groups.keys()].filter(Boolean).length > 1;
  return [...groups].map(([day, rows]) => ({
    key: day ?? "undated",
    label:
      day === null
        ? null
        : day === selectedDate
          ? multipleDates
            ? "Selected day"
            : null
          : recordDate(rows[0]!.recordedAt),
    events: rows
  }));
}
