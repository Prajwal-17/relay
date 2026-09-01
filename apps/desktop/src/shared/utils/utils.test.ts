import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  formatINR,
  formatRupee,
  paisaToRupees,
  paisaToRupeeString,
  roundPaisaToNearestRupee,
  rupeesToPaisa
} from "../utils/utils";

describe("paisaToRupees", () => {
  it("divides by 100 for standard whole-paisa values", () => {
    expect(paisaToRupees(100)).toBe(1);
    expect(paisaToRupees(5499)).toBe(54.99);
    expect(paisaToRupees(18000)).toBe(180);
    expect(paisaToRupees(1_000_000)).toBe(10_000);
  });

  it("returns 0 for zero input", () => {
    expect(paisaToRupees(0)).toBe(0);
  });

  it("converts one paisa without losing the sub-rupee amount", () => {
    expect(paisaToRupees(1)).toBe(0.01);
  });

  it("handles sub-rupee paisa values", () => {
    expect(paisaToRupees(2)).toBe(0.02);
    expect(paisaToRupees(50)).toBe(0.5);
    expect(paisaToRupees(99)).toBe(0.99);
  });

  it("preserves a negative paisa amount", () => {
    expect(paisaToRupees(-100)).toBe(-1);
    expect(paisaToRupees(-2341)).toBe(-23.41);
  });

  it("does not round — fractional paisa produce fractional rupees", () => {
    expect(paisaToRupees(1.5)).toBeCloseTo(0.015, 10);
    expect(paisaToRupees(33.33)).toBeCloseTo(0.3333, 10);
  });

  it("handles very large values without overflow", () => {
    expect(paisaToRupees(999_999_999)).toBe(9_999_999.99);
    expect(paisaToRupees(10_000_000_000)).toBe(100_000_000);
  });

  it("throws on NaN, including the function name in the message", () => {
    expect(() => paisaToRupees(NaN)).toThrow("paisaToRupees");
  });

  it("throws on Infinity and -Infinity", () => {
    expect(() => paisaToRupees(Infinity)).toThrow();
    expect(() => paisaToRupees(-Infinity)).toThrow();
  });

  it("rejects null passed at runtime instead of coercing it to money", () => {
    expect(() => paisaToRupees(null as unknown as number)).toThrow("paisaToRupees");
  });
});

describe("rupeesToPaisa", () => {
  it("multiplies by 100 and rounds to the nearest integer", () => {
    expect(rupeesToPaisa(1)).toBe(100);
    expect(rupeesToPaisa(54.99)).toBe(5499);
    expect(rupeesToPaisa(180)).toBe(18000);
    expect(rupeesToPaisa(0.01)).toBe(1);
  });

  it("returns 0 for zero input", () => {
    expect(rupeesToPaisa(0)).toBe(0);
  });

  it("handles negative rupee values", () => {
    expect(rupeesToPaisa(-1)).toBe(-100);
    expect(rupeesToPaisa(-23.41)).toBe(-2341);
  });

  it("rounds a positive half-paisa away from zero", () => {
    expect(rupeesToPaisa(0.005)).toBe(1);
  });

  it("rounds a negative half-paisa toward positive infinity (Math.round semantics)", () => {
    expect(rupeesToPaisa(-0.005)).toBe(-0);
  });

  it("rounds sub-paisa fractions for positive values", () => {
    expect(rupeesToPaisa(12.344)).toBe(1234);
    expect(rupeesToPaisa(12.345)).toBe(1235);
    expect(rupeesToPaisa(12.349)).toBe(1235);
  });

  it("always returns an integer (no fractional paisa)", () => {
    expect(Number.isInteger(rupeesToPaisa(3.33333))).toBe(true);
  });

  it("is the inverse of paisaToRupees for whole-paisa values", () => {
    expect(paisaToRupees(rupeesToPaisa(54.99))).toBe(54.99);
  });

  it("throws on NaN, including the function name in the message", () => {
    expect(() => rupeesToPaisa(NaN)).toThrow("rupeesToPaisa");
  });

  it("throws on Infinity and -Infinity", () => {
    expect(() => rupeesToPaisa(Infinity)).toThrow();
    expect(() => rupeesToPaisa(-Infinity)).toThrow();
  });

  it("rejects a numeric string instead of coercing it to money", () => {
    expect(() => rupeesToPaisa("54.99" as unknown as number)).toThrow("rupeesToPaisa");
  });
});

describe("roundPaisaToNearestRupee", () => {
  it("rounds payable totals to the nearest whole rupee", () => {
    expect(roundPaisaToNearestRupee(15_234)).toBe(15_200);
    expect(roundPaisaToNearestRupee(15_249)).toBe(15_200);
    expect(roundPaisaToNearestRupee(15_250)).toBe(15_300);
    expect(roundPaisaToNearestRupee(15_299)).toBe(15_300);
  });

  it("keeps whole-rupee and zero totals unchanged", () => {
    expect(roundPaisaToNearestRupee(15_200)).toBe(15_200);
    expect(roundPaisaToNearestRupee(0)).toBe(0);
  });

  it("rejects non-finite values", () => {
    expect(() => roundPaisaToNearestRupee(Number.NaN)).toThrow("roundPaisaToNearestRupee");
    expect(() => roundPaisaToNearestRupee(Infinity)).toThrow("roundPaisaToNearestRupee");
  });
});

// CONFLICT: File 1 and File 2 disagree on whole-rupee formatting.
//   File 1: paisaToRupeeString(100) === "1"     (strip ".00", keep meaningful zeros)
//   File 2: paisaToRupeeString(100) === "1.00"  (always 2 decimals)
// Kept File 1's behavior — it has 8 internally consistent examples, and the
// "strip .00 / keep .50" rule is what distinguishes this from formatRupee.
// Confirm against utils.ts.
describe("paisaToRupeeString", () => {
  it("returns a plain decimal string, dropping a trailing .00", () => {
    expect(paisaToRupeeString(5499)).toBe("54.99");
    expect(paisaToRupeeString(100)).toBe("1");
    expect(paisaToRupeeString(5400)).toBe("54");
    expect(paisaToRupeeString(1)).toBe("0.01");
  });

  it("returns '0' for zero", () => {
    expect(paisaToRupeeString(0)).toBe("0");
  });

  it("retains a meaningful trailing zero in a decimal display", () => {
    expect(paisaToRupeeString(5450)).toBe("54.50");
  });

  it("never includes a currency symbol", () => {
    expect(paisaToRupeeString(999_999)).toBe("9999.99");
    expect(paisaToRupeeString(999_999)).not.toContain("₹");
  });

  it("handles negative paisa", () => {
    expect(paisaToRupeeString(-100)).toBe("-1");
    expect(paisaToRupeeString(-2341)).toBe("-23.41");
  });

  it("throws on NaN, including the function name in the message", () => {
    expect(() => paisaToRupeeString(NaN)).toThrow("paisaToRupeeString");
  });

  it("throws on Infinity and -Infinity", () => {
    expect(() => paisaToRupeeString(Infinity)).toThrow();
    expect(() => paisaToRupeeString(-Infinity)).toThrow();
  });
});

describe("formatRupee", () => {
  it("formats paisa as ₹ with 2 decimal places and no space after the symbol", () => {
    expect(formatRupee(5499)).toBe("₹54.99");
    expect(formatRupee(100)).toBe("₹1.00");
  });

  it("formats zero paisa as ₹0.00", () => {
    expect(formatRupee(0)).toBe("₹0.00");
  });

  it("uses Indian number grouping (lakh/crore system)", () => {
    expect(formatRupee(1_000_000)).toBe("₹10,000.00");
    expect(formatRupee(10_000_000)).toBe("₹1,00,000.00");
  });

  // Kept loose: neither file pins the exact sign/symbol ordering for negatives.
  it("handles negative values", () => {
    const result = formatRupee(-5499);
    expect(result).toContain("54.99");
    expect(result).toContain("₹");
    expect(result).toContain("-");
  });

  it("throws on NaN, including the function name in the message", () => {
    expect(() => formatRupee(NaN)).toThrow("formatRupee");
  });

  it("throws on Infinity and -Infinity", () => {
    expect(() => formatRupee(Infinity)).toThrow();
    expect(() => formatRupee(-Infinity)).toThrow();
  });
});

describe("formatINR", () => {
  it("formats a rupee number with ₹ symbol and 2 decimal places", () => {
    expect(formatINR.format(0)).toBe("₹0.00");
    expect(formatINR.format(12.5)).toBe("₹12.50");
  });

  it("uses Indian comma grouping (lakh/crore system)", () => {
    expect(formatINR.format(1000)).toBe("₹1,000.00");
    expect(formatINR.format(100000)).toBe("₹1,00,000.00");
  });

  // Kept loose: neither file pins the exact sign/symbol ordering for negatives.
  it("handles negative numbers", () => {
    const result = formatINR.format(-500);
    expect(result).toContain("₹");
    expect(result).toContain("500.00");
    expect(result).toContain("-");
  });
});

describe("invariants", () => {
  it("round-trips every whole-paisa amount through paisaToRupees and back", () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000_000, max: 100_000_000 }), (paisa) => {
        expect(rupeesToPaisa(paisaToRupees(paisa))).toBe(paisa);
      }),
      { seed: 20260716, numRuns: 1_000 }
    );
  });
});
