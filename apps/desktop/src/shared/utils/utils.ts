/**
 * Singleton Intl.NumberFormat for INR currency display.
 * Reuse this instance via `.format(rupees)` when you already have a rupee value.
 * @example formatINR.format(54.99) => "₹54.99"
 */
export const formatINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2
});

// ------------
// Conversion
// ------------

/**
 * Converts paisa to rupees for arithmetic.
 * @throws if input is not a finite number.
 * @example paisaToRupees(5499) => 54.99
 */
export function paisaToRupees(valueInPaisa: number): number {
  if (typeof valueInPaisa !== "number" || !Number.isFinite(valueInPaisa)) {
    throw new Error(
      `paisaToRupees: expected a finite number, got ${typeof valueInPaisa} ${JSON.stringify(valueInPaisa)}`
    );
  }
  return valueInPaisa / 100;
}

/**
 * Converts rupees to paisa for storage.
 * @throws if input is not a finite number.
 * @example rupeesToPaisa(54.99) => 5499
 */
export function rupeesToPaisa(valueInRupees: number): number {
  if (typeof valueInRupees !== "number" || !Number.isFinite(valueInRupees)) {
    throw new Error(
      `rupeesToPaisa: expected a finite number, got ${typeof valueInRupees} ${JSON.stringify(valueInRupees)}`
    );
  }
  return Math.round(valueInRupees * 100);
}

// ------------------------
// Formatting (displaying)
// ------------------------

/**
 * Converts paisa to a plain decimal string (no currency symbol).
 * - Always renders 2 decimal places.
 * @throws if input is not a finite number.
 * @example paisaToRupeeString(5499) => "54.99"
 */
export function paisaToRupeeString(valueInPaisa: number): string {
  if (typeof valueInPaisa !== "number" || !Number.isFinite(valueInPaisa)) {
    throw new Error(
      `paisaToRupeeString: expected a finite number, got ${typeof valueInPaisa} ${JSON.stringify(valueInPaisa)}`
    );
  }
  return (valueInPaisa / 100).toFixed(2).replace(/\.00$/, "");
}

/**
 * Formats paisa as a currency string with rupee symbol and proper grouping.
 * - This is the primary display function for prices.
 * @throws if input is not a finite number.
 * @example formatRupee(5499) => "₹54.99"
 */
export function formatRupee(valueInPaisa: number): string {
  if (typeof valueInPaisa !== "number" || !Number.isFinite(valueInPaisa)) {
    throw new Error(
      `formatRupee: expected a finite number, got ${typeof valueInPaisa} ${JSON.stringify(valueInPaisa)}`
    );
  }
  return formatINR.format(valueInPaisa / 100);
}
