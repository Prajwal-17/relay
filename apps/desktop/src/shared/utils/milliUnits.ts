const MILLI_MULTIPLIER = 1000;

/**
 * Converts a unit value to milli-units (×1000).
 * Accepts string input (parsed via Number) to ease quantity input handling.
 * @example toMilliUnits(1.5) => 1500
 * @example toMilliUnits("2.75") => 2750
 */
export function toMilliUnits(value: number | string): number {
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.round(num * MILLI_MULTIPLIER);
}

/**
 * Converts milli-units back to standard units (÷1000).
 * @example fromMilliUnits(1500) => 1.5
 */
export function fromMilliUnits(milliValue: number): number {
  if (typeof milliValue !== "number" || isNaN(milliValue) || !Number.isFinite(milliValue)) return 0;
  return milliValue / MILLI_MULTIPLIER;
}
