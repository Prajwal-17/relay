import { describe, expect, it } from "vitest";
import {
  convertToPaisa,
  convertToRupees,
  formatINR,
  formatToRupees,
  fromMilliUnits,
  toMilliUnits
} from "../utils/utils";

describe("Currency Utils", () => {
  describe("convertToRupees (Paisa -> Rupees)", () => {
    it("convert paisa to rupees correctly", () => {
      expect(convertToRupees(234)).toBe(2.34);
      expect(convertToRupees(238023)).toBe(2380.23);
      expect(convertToRupees(18000)).toBe(180.0);
      expect(convertToRupees(2)).toBe(0.02);
      expect(convertToRupees(34)).toBe(0.34);
      expect(convertToRupees(1000000)).toBe(10000);
      expect(convertToRupees(999999999)).toBe(9999999.99);
    });

    it("handles zero value", () => {
      expect(convertToRupees(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(convertToRupees(-2341)).toBe(-23.41);
      expect(convertToRupees(-100)).toBe(-1);
    });

    it("handles decimal inputs", () => {
      expect(convertToRupees(23.344)).toBe(0.23344);
      expect(convertToRupees(0.7399)).toBe(0.007399);
      expect(convertToRupees(1.33333)).toBe(0.0133333);
      expect(convertToRupees(0.3333333333333333)).toBe(0.003333333333333333);
    });

    it("floating point errors", () => {
      expect(convertToRupees(1)).toBe(0.01);
      expect(convertToRupees(33)).toBe(0.33);
      expect(convertToRupees(333)).toBe(3.33);
    });

    it("should return 0 for NaN", () => {
      expect(convertToRupees(NaN)).toBe(0);
    });

    it("should return 0 for Infinity (not propagate Infinity downstream)", () => {
      expect(convertToRupees(Infinity)).toBe(0);
      expect(convertToRupees(-Infinity)).toBe(0);
    });
  });
  describe("convertToPaisa (Rupees -> Paisa)", () => {
    it("convert rupees to paisa correctly", () => {
      expect(convertToPaisa(2.34)).toBe(234);
      expect(convertToPaisa(2380.23)).toBe(238023);
      expect(convertToPaisa(180.0)).toBe(18000);
      expect(convertToPaisa(0.02)).toBe(2);
      expect(convertToPaisa(0.34)).toBe(34);
      expect(convertToPaisa(10000)).toBe(1000000);
    });

    it("handles zero value", () => {
      expect(convertToPaisa(0)).toBe(0);
    });

    it("handles negative values", () => {
      expect(convertToPaisa(-23.41)).toBe(-2341);
      expect(convertToPaisa(-1)).toBe(-100);
    });

    it("handles rounding correctly", () => {
      expect(convertToPaisa(12.344)).toBe(1234);
      expect(convertToPaisa(12.345)).toBe(1235);
      expect(convertToPaisa(12.346)).toBe(1235);
    });

    it("should return string when asString is true", () => {
      // @ts-ignore - build fix
      expect(convertToPaisa(2.34, true)).toBe("234");
      // @ts-ignore - build fix
      expect(convertToPaisa(0, true)).toBe("0");
    });

    it("should return 0 for NaN", () => {
      expect(convertToPaisa(NaN)).toBe(0);
      // @ts-ignore - build fix
      expect(convertToPaisa(NaN, true)).toBe("0");
    });

    it("should return 0 for Infinity (not propagate Infinity downstream)", () => {
      expect(convertToPaisa(Infinity)).toBe(0);
      expect(convertToPaisa(-Infinity)).toBe(0);
    });
  });

  describe("formatToRupees", () => {
    it("formats paisa to formatted rupee string", () => {
      const res = formatToRupees(1234);
      expect(res).toContain("12.34");
      expect(res).toMatch(/₹\s?12\.34/);

      expect(formatToRupees(0)).toMatch(/₹\s?0\.00/);
      expect(formatToRupees(100)).toMatch(/₹\s?1\.00/);
    });

    it("handles negative values", () => {
      expect(formatToRupees(-1234)).toMatch(/-₹\s?12\.34|₹\s?-12\.34/);
    });

    it("handles N/A cases", () => {
      expect(formatToRupees(NaN)).toBe("N/A");
      expect(formatToRupees(Infinity)).toBe("N/A");
    });
  });

  describe("Options Object Support", () => {
    it("convertToRupees supports options object", () => {
      expect(convertToRupees(234, { asString: false })).toBe(2.34);
      expect(convertToRupees(234, { asString: true })).toBe("2.34");
      expect(convertToRupees(0, { asString: true })).toBe("0");
    });

    it("convertToPaisa supports options object", () => {
      expect(convertToPaisa(2.34, { asString: false })).toBe(234);
      expect(convertToPaisa(2.34, { asString: true })).toBe("234");
      expect(convertToPaisa(0, { asString: true })).toBe("0");
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

    it("rejects mixed alphanumeric strings — returns 0 instead of silently parsing garbage", () => {
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

    it("returns 0 for Infinity (consistent with toMilliUnits guard)", () => {
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
