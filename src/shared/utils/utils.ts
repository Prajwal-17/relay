export const formatINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2
});

// function overloading
export function convertToRupees(valueInPaisa: number, options: { asString: true }): string;
export function convertToRupees(valueInPaisa: number, options: { asString: false }): number;
export function convertToRupees(valueInPaisa: number, options?: { asString?: boolean }): number;

export function convertToRupees(
  valueInPaisa: number,
  optionsOrAsString: boolean | { asString?: boolean } = false
): number | string {
  const asString =
    typeof optionsOrAsString === "boolean" ? optionsOrAsString : optionsOrAsString?.asString;

  if (typeof valueInPaisa !== "number" || isNaN(valueInPaisa)) {
    return asString ? "0" : 0;
  }
  const rupees = valueInPaisa / 100;
  return asString ? rupees.toString() : rupees;
}

// function overloading
export function convertToPaisa(valueInRupees: number, options: { asString: true }): string;
export function convertToPaisa(valueInRupees: number, options: { asString: false }): number;
export function convertToPaisa(valueInRupees: number, options?: { asString?: boolean }): number;

export function convertToPaisa(
  valueInRupees: number,
  optionsOrAsString: boolean | { asString?: boolean } = false
): number | string {
  const asString =
    typeof optionsOrAsString === "boolean" ? optionsOrAsString : optionsOrAsString?.asString;

  if (typeof valueInRupees !== "number" || isNaN(valueInRupees)) {
    return asString ? "0" : 0;
  }
  const paisa = Math.round(valueInRupees * 100);
  return asString ? paisa.toString() : paisa;
}

export function formatToRupees(valueInPaisa: number): string {
  if (typeof valueInPaisa !== "number" || isNaN(valueInPaisa) || !Number.isFinite(valueInPaisa)) {
    return "N/A";
  }
  const rupees = convertToRupees(valueInPaisa);
  return formatINR.format(rupees);
}
