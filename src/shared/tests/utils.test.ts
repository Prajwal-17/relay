import { describe, expect, it } from "vitest";
import { convertToPaisa, convertToRupees, formatToRupees } from "../utils/utils";

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
});
