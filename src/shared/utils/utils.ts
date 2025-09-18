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

export const IndianRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});
