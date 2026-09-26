const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatRupee(paisa: number): string {
  return inrFormatter.format(paisa / 100);
}

export function paisaToInput(paisa: number): string {
  if (paisa === 0) return "";
  return (paisa / 100).toFixed(2).replace(/\.00$/, "");
}

export function formatCompactRupee(paisa: number): string {
  const rupees = paisa / 100;
  const absolute = Math.abs(rupees);
  const sign = rupees < 0 ? "−" : "";

  if (absolute >= 10_000_000) return `${sign}₹${trimCompact(absolute / 10_000_000)}Cr`;
  if (absolute >= 100_000) return `${sign}₹${trimCompact(absolute / 100_000)}L`;
  if (absolute >= 1_000) return `${sign}₹${trimCompact(absolute / 1_000)}K`;
  return `${sign}₹${Math.round(absolute)}`;
}

function trimCompact(value: number): string {
  return value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
}

export type ParsedAmount = { paisa: number; error: null } | { paisa: null; error: string };

export function parseRupeeInput(value: string, label = "Amount"): ParsedAmount {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return { paisa: 0, error: null };

  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) {
    return { paisa: null, error: `${label} must be a positive amount with up to 2 decimals.` };
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(paisa)) {
    return { paisa: null, error: `${label} is too large.` };
  }

  return { paisa, error: null };
}
