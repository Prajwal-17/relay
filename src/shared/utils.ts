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

export function formatTimeStr(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeStyle: "short"
  });
}
