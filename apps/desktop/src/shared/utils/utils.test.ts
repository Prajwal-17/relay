import { describe, expect, it } from "vitest";
import {
  formatINR,
  formatRupee,
  paisaToRupees,
  paisaToRupeeString,
  rupeesToPaisa
} from "../utils/utils";
describe("Currency Utils", () => {
  describe("paisaToRupees", () => {
    it("divides by 100 for standard whole-paisa values", () => {
      expect(paisaToRupees(100)).toBe(1);
      expect(paisaToRupees(5499)).toBe(54.99);
      expect(paisaToRupees(18000)).toBe(180);
      expect(paisaToRupees(1000000)).toBe(10000);
    });

    it("returns 0 for zero input", () => {
      expect(paisaToRupees(0)).toBe(0);
    });

    it("handles single-digit paisa (sub-rupee values)", () => {
      expect(paisaToRupees(1)).toBe(0.01);
      expect(paisaToRupees(2)).toBe(0.02);
      expect(paisaToRupees(50)).toBe(0.5);
      expect(paisaToRupees(99)).toBe(0.99);
    });

    it("handles negative paisa correctly", () => {
      expect(paisaToRupees(-100)).toBe(-1);
      expect(paisaToRupees(-2341)).toBe(-23.41);
    });

    it("does NOT round — fractional paisa produce fractional rupees", () => {
      expect(paisaToRupees(1.5)).toBeCloseTo(0.015, 10);
      expect(paisaToRupees(33.33)).toBeCloseTo(0.3333, 10);
    });

    it("handles very large values without overflow", () => {
      expect(paisaToRupees(999999999)).toBe(9999999.99);
      expect(paisaToRupees(10000000000)).toBe(100000000);
    });

    it("throws on NaN", () => {
      expect(() => paisaToRupees(NaN)).toThrow();
    });

    it("throws on Infinity and -Infinity", () => {
      expect(() => paisaToRupees(Infinity)).toThrow();
      expect(() => paisaToRupees(-Infinity)).toThrow();
    });

    it("includes function name in error message for diagnostics", () => {
      expect(() => paisaToRupees(NaN)).toThrow("paisaToRupees");
    });
  });

  describe("rupeesToPaisa", () => {
    it("multiplies by 100 and rounds to nearest integer", () => {
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

    it("rounds sub-paisa fractions using Math.round semantics", () => {
      expect(rupeesToPaisa(12.344)).toBe(1234);
      expect(rupeesToPaisa(12.345)).toBe(1235);
      expect(rupeesToPaisa(12.349)).toBe(1235);
    });

    it("always returns an integer (no fractional paisa)", () => {
      const result = rupeesToPaisa(3.33333);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("is the inverse of paisaToRupees for whole-paisa values", () => {
      const original = 54.99;
      expect(paisaToRupees(rupeesToPaisa(original))).toBe(original);
    });

    it("throws on NaN", () => {
      expect(() => rupeesToPaisa(NaN)).toThrow();
    });

    it("throws on Infinity and -Infinity", () => {
      expect(() => rupeesToPaisa(Infinity)).toThrow();
      expect(() => rupeesToPaisa(-Infinity)).toThrow();
    });

    it("includes function name in error message for diagnostics", () => {
      expect(() => rupeesToPaisa(NaN)).toThrow("rupeesToPaisa");
    });
  });

  describe("paisaToRupeeString", () => {
    it("returns a plain decimal string, dropping trailing .00", () => {
      expect(paisaToRupeeString(5499)).toBe("54.99");
      expect(paisaToRupeeString(100)).toBe("1");
      expect(paisaToRupeeString(5400)).toBe("54");
      expect(paisaToRupeeString(1)).toBe("0.01");
      expect(paisaToRupeeString(5450)).toBe("54.50");
    });

    it("returns '0' for zero", () => {
      expect(paisaToRupeeString(0)).toBe("0");
    });

    it("never includes a currency symbol", () => {
      const result = paisaToRupeeString(999999);
      expect(result).not.toContain("₹");
      expect(result).toBe("9999.99");
    });

    it("handles negative paisa", () => {
      expect(paisaToRupeeString(-100)).toBe("-1");
      expect(paisaToRupeeString(-2341)).toBe("-23.41");
    });

    it("truncates beyond 2 decimal places (toFixed rounding)", () => {
      expect(paisaToRupeeString(1)).toBe("0.01");
    });

    it("throws on NaN", () => {
      expect(() => paisaToRupeeString(NaN)).toThrow("paisaToRupeeString");
    });

    it("throws on Infinity and -Infinity", () => {
      expect(() => paisaToRupeeString(Infinity)).toThrow();
      expect(() => paisaToRupeeString(-Infinity)).toThrow();
    });
  });

  describe("formatRupee", () => {
    it("formats paisa as ₹ currency string with 2 decimal places", () => {
      expect(formatRupee(5499)).toMatch(/₹\s?54\.99/);
      expect(formatRupee(100)).toMatch(/₹\s?1\.00/);
    });

    it("formats zero paisa as ₹0.00", () => {
      expect(formatRupee(0)).toMatch(/₹\s?0\.00/);
    });

    it("uses Indian number grouping (lakh/crore system)", () => {
      expect(formatRupee(1000000)).toMatch(/₹\s?10,000\.00/);
      expect(formatRupee(10000000)).toMatch(/₹\s?1,00,000\.00/);
    });

    it("handles negative values", () => {
      const result = formatRupee(-5499);
      expect(result).toContain("54.99");
      expect(result).toContain("₹");
    });

    it("throws on NaN", () => {
      expect(() => formatRupee(NaN)).toThrow("formatRupee");
    });

    it("throws on Infinity", () => {
      expect(() => formatRupee(Infinity)).toThrow();
      expect(() => formatRupee(-Infinity)).toThrow();
    });
  });

  describe("formatINR", () => {
    it("formats a rupee number with ₹ symbol and 2 decimal places", () => {
      expect(formatINR.format(0)).toMatch(/₹\s?0\.00/);
      expect(formatINR.format(12.5)).toMatch(/₹\s?12\.50/);
    });

    it("uses Indian comma grouping (e.g. ₹1,00,000.00)", () => {
      expect(formatINR.format(1000)).toMatch(/₹\s?1,000\.00/);
      expect(formatINR.format(100000)).toMatch(/₹\s?1,00,000\.00/);
    });

    it("handles negative numbers", () => {
      const result = formatINR.format(-500);
      expect(result).toContain("₹");
      expect(result).toContain("500.00");
    });
  });
});
