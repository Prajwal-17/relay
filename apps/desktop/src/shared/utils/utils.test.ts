import { describe, expect, it } from "vitest";
import {
  formatINR,
  formatRupee,
  paisaToRupees,
  paisaToRupeeString,
  rupeesToPaisa
} from "../utils/utils";
import { fromMilliUnits, toMilliUnits } from "../utils/milliUnits";

describe("Currency Utils", () => {
  describe("paisaToRupees (Paisa -> Rupees)", () => {
    it("converts paisa to rupees correctly", () => {
      expect(paisaToRupees(234)).toBe(2.34);
      expect(paisaToRupees(238023)).toBe(2380.23);
      expect(paisaToRupees(18000)).toBe(180.0);
      expect(paisaToRupees(2)).toBe(0.02);
      expect(paisaToRupees(34)).toBe(0.34);
      expect(paisaToRupees(1000000)).toBe(10000);
      expect(paisaToRupees(999999999)).toBe(9999999.99);
    });

    it("handles zero value", () => {
      expect(paisaToRupees(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(paisaToRupees(-2341)).toBe(-23.41);
      expect(paisaToRupees(-100)).toBe(-1);
    });

    it("handles decimal inputs", () => {
      expect(paisaToRupees(23.344)).toBe(0.23344);
      expect(paisaToRupees(0.7399)).toBe(0.007399);
      expect(paisaToRupees(1.33333)).toBe(0.0133333);
      expect(paisaToRupees(0.3333333333333333)).toBe(0.003333333333333333);
    });

    it("floating point edge cases", () => {
      expect(paisaToRupees(1)).toBe(0.01);
      expect(paisaToRupees(33)).toBe(0.33);
      expect(paisaToRupees(333)).toBe(3.33);
    });

    it("throws on NaN", () => {
      expect(() => paisaToRupees(NaN)).toThrow("paisaToRupees");
    });

    it("throws on Infinity", () => {
      expect(() => paisaToRupees(Infinity)).toThrow("paisaToRupees");
      expect(() => paisaToRupees(-Infinity)).toThrow("paisaToRupees");
    });
  });

  describe("rupeesToPaisa (Rupees -> Paisa)", () => {
    it("converts rupees to paisa correctly", () => {
      expect(rupeesToPaisa(2.34)).toBe(234);
      expect(rupeesToPaisa(2380.23)).toBe(238023);
      expect(rupeesToPaisa(180.0)).toBe(18000);
      expect(rupeesToPaisa(0.02)).toBe(2);
      expect(rupeesToPaisa(0.34)).toBe(34);
      expect(rupeesToPaisa(10000)).toBe(1000000);
    });

    it("handles zero value", () => {
      expect(rupeesToPaisa(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(rupeesToPaisa(-23.41)).toBe(-2341);
      expect(rupeesToPaisa(-1)).toBe(-100);
    });

    it("handles rounding correctly", () => {
      expect(rupeesToPaisa(12.344)).toBe(1234);
      expect(rupeesToPaisa(12.345)).toBe(1235);
      expect(rupeesToPaisa(12.346)).toBe(1235);
    });

    it("throws on NaN", () => {
      expect(() => rupeesToPaisa(NaN)).toThrow("rupeesToPaisa");
    });

    it("throws on Infinity", () => {
      expect(() => rupeesToPaisa(Infinity)).toThrow("rupeesToPaisa");
      expect(() => rupeesToPaisa(-Infinity)).toThrow("rupeesToPaisa");
    });
  });

  describe("paisaToRupeeString", () => {
    it("converts paisa to plain decimal string", () => {
      expect(paisaToRupeeString(234)).toBe("2.34");
      expect(paisaToRupeeString(238023)).toBe("2380.23");
      expect(paisaToRupeeString(18000)).toBe("180.00");
      expect(paisaToRupeeString(2)).toBe("0.02");
      expect(paisaToRupeeString(0)).toBe("0.00");
      expect(paisaToRupeeString(5400)).toBe("54.00");
    });

    it("handles negative values", () => {
      expect(paisaToRupeeString(-2341)).toBe("-23.41");
      expect(paisaToRupeeString(-100)).toBe("-1.00");
    });

    it("throws on NaN", () => {
      expect(() => paisaToRupeeString(NaN)).toThrow("paisaToRupeeString");
    });

    it("throws on Infinity", () => {
      expect(() => paisaToRupeeString(Infinity)).toThrow("paisaToRupeeString");
      expect(() => paisaToRupeeString(-Infinity)).toThrow("paisaToRupeeString");
    });
  });

  describe("formatRupee", () => {
    it("formats paisa to formatted rupee string", () => {
      const res = formatRupee(1234);
      expect(res).toContain("12.34");
      expect(res).toMatch(/₹\s?12\.34/);

      expect(formatRupee(0)).toMatch(/₹\s?0\.00/);
      expect(formatRupee(100)).toMatch(/₹\s?1\.00/);
    });

    it("handles negative values", () => {
      expect(formatRupee(-1234)).toMatch(/-₹\s?12\.34|₹\s?-12\.34/);
    });

    it("throws on NaN", () => {
      expect(() => formatRupee(NaN)).toThrow("formatRupee");
    });

    it("throws on Infinity", () => {
      expect(() => formatRupee(Infinity)).toThrow("formatRupee");
      expect(() => formatRupee(-Infinity)).toThrow("formatRupee");
    });
  });

  describe("formatINR formatter", () => {
    it("formats number as INR currency", () => {
      expect(formatINR.format(1000)).toMatch(/₹\s?1,000\.00/);
      expect(formatINR.format(0)).toMatch(/₹\s?0\.00/);
      expect(formatINR.format(12.5)).toMatch(/₹\s?12\.50/);
      expect(formatINR.format(9999999.99)).toMatch(/₹\s?99,99,999\.99|₹\s?9,99,99,999\.99/);
    });

    it("formats negative numbers as INR currency", () => {
      const result = formatINR.format(-500);
      expect(result).toMatch(/₹/);
      expect(result).toContain("500.00");
    });
  });
});

describe("Milli Unit Conversion", () => {
  describe("toMilliUnits", () => {
    it("converts integer to milli units", () => {
      expect(toMilliUnits(1)).toBe(1000);
      expect(toMilliUnits(2)).toBe(2000);
      expect(toMilliUnits(100)).toBe(100000);
    });

    it("converts float to milli units", () => {
      expect(toMilliUnits(1.5)).toBe(1500);
      expect(toMilliUnits(2.75)).toBe(2750);
      expect(toMilliUnits(0.001)).toBe(1);
      expect(toMilliUnits(0.0001)).toBe(0);
    });

    it("handles zero", () => {
      expect(toMilliUnits(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(toMilliUnits(-1)).toBe(-1000);
      expect(toMilliUnits(-1.5)).toBe(-1500);
      expect(toMilliUnits(-0.001)).toBe(-1);
    });

    it("handles NaN", () => {
      expect(toMilliUnits(NaN)).toBe(0);
    });

    it("handles Infinity", () => {
      expect(toMilliUnits(Infinity)).toBe(0);
      expect(toMilliUnits(-Infinity)).toBe(0);
    });

    it("handles rounding correctly", () => {
      expect(toMilliUnits(1.0005)).toBe(1001);
      expect(toMilliUnits(1.0004)).toBe(1000);
      expect(toMilliUnits(0.0005)).toBe(1);
      expect(toMilliUnits(0.0004)).toBe(0);
    });

    it("accepts string input", () => {
      expect(toMilliUnits("1.5")).toBe(1500);
      expect(toMilliUnits("100")).toBe(100000);
      expect(toMilliUnits("0")).toBe(0);
      expect(toMilliUnits("-2.5")).toBe(-2500);
    });

    it("returns 0 for invalid string input", () => {
      expect(toMilliUnits("")).toBe(0);
      expect(toMilliUnits("abc")).toBe(0);
    });

    it("rejects mixed alphanumeric strings", () => {
      expect(toMilliUnits("12abc")).toBe(0);
      expect(toMilliUnits("3.5xyz")).toBe(0);
    });

    it("handles large numbers", () => {
      expect(toMilliUnits(1000000)).toBe(1000000000);
    });
  });

  describe("fromMilliUnits", () => {
    it("converts milli units to base units", () => {
      expect(fromMilliUnits(1000)).toBe(1);
      expect(fromMilliUnits(1500)).toBe(1.5);
      expect(fromMilliUnits(2750)).toBe(2.75);
      expect(fromMilliUnits(1)).toBe(0.001);
    });

    it("handles zero", () => {
      expect(fromMilliUnits(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(fromMilliUnits(-1000)).toBe(-1);
      expect(fromMilliUnits(-1500)).toBe(-1.5);
    });

    it("handles NaN", () => {
      expect(fromMilliUnits(NaN)).toBe(0);
    });

    it("handles Infinity", () => {
      expect(fromMilliUnits(Infinity)).toBe(0);
      expect(fromMilliUnits(-Infinity)).toBe(0);
    });

    it("preserves floating point precision", () => {
      expect(fromMilliUnits(1)).toBeCloseTo(0.001);
      expect(fromMilliUnits(3)).toBeCloseTo(0.003);
      expect(fromMilliUnits(333)).toBeCloseTo(0.333);
    });

    it("handles large numbers", () => {
      expect(fromMilliUnits(1000000000)).toBe(1000000);
    });
  });
});
