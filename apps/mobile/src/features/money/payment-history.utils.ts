import { formatDateStrToISTDateObject, formatDateStrToISTDateStr } from "@relay/shared/date-utils";

export function paymentTime(timestamp: string): string {
  const { timePart } = formatDateStrToISTDateStr(timestamp);
  return timePart === "-" ? "Time unavailable" : timePart.toUpperCase();
}

export function paymentDateTime(timestamp: string): string {
  const { fullDate, timePart } = formatDateStrToISTDateStr(timestamp);
  return fullDate === "-" ? "Time unavailable" : `${fullDate} · ${timePart.toUpperCase()}`;
}

export function entryDateTimes(createdAt: string, updatedAt?: string) {
  const created = formatDateStrToISTDateObject(createdAt);
  const updated = updatedAt ? formatDateStrToISTDateObject(updatedAt) : null;
  return {
    created: paymentDateTime(createdAt),
    updated:
      created && updated && updated.getTime() > created.getTime()
        ? paymentDateTime(updatedAt!)
        : null
  };
}
