export function formatToRupees(valueInPaisa: number): number {
  if (typeof valueInPaisa !== "number" || isNaN(valueInPaisa)) return 0;
  const rupees = valueInPaisa / 100;
  return rupees;
}

export function formatToPaisa(valueInRupees: number): number {
  if (typeof valueInRupees !== "number" || isNaN(valueInRupees)) return 0;
  const paisa = Math.round(valueInRupees * 100);
  return paisa;
}

export function formatDateStr(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium"
  });
}

export function formatDateTimeToIST(dateStr?: string): string {
  if (!dateStr) return "-";

  // '2025-08-31 06:38:13' -> '2025-08-31T06:38:13Z'
  const utcTimestamp = dateStr.replace(" ", "T") + "Z";

  const date = new Date(utcTimestamp);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  });
}

export function removeTandZ(isoString: string) {
  if (!isoString) return;
  return isoString.replaceAll("T", " ").replaceAll("Z", " ").slice(0, -5);
}
