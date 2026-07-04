import { describe, expect, it } from "vitest";
import { fromMilliUnits, toMilliUnits } from "../utils/milliUnits";

describe("toMilliUnits", () => {
  it("multiplies integers by 1000", () => {
    expect(toMilliUnits(1)).toBe(1000);
    expect(toMilliUnits(5)).toBe(5000);
    expect(toMilliUnits(100)).toBe(100000);
  });

  it("multiplies decimals by 1000 and rounds to nearest integer", () => {
    expect(toMilliUnits(1.5)).toBe(1500);
    expect(toMilliUnits(2.75)).toBe(2750);
    expect(toMilliUnits(0.001)).toBe(1);
  });

  it("rounds using Math.round semantics (>=0.5 up, <0.5 down)", () => {
    expect(toMilliUnits(1.0005)).toBe(1001);
    expect(toMilliUnits(1.0004)).toBe(1000);
    expect(toMilliUnits(0.0005)).toBe(1);
    expect(toMilliUnits(0.0004)).toBe(0);
  });

  it("always returns an integer", () => {
    expect(Number.isInteger(toMilliUnits(3.14159))).toBe(true);
    expect(Number.isInteger(toMilliUnits(0.1))).toBe(true);
    expect(Number.isInteger(toMilliUnits("7.777"))).toBe(true);
  });

  it("returns 0 for zero", () => {
    expect(toMilliUnits(0)).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(toMilliUnits(-1)).toBe(-1000);
    expect(toMilliUnits(-1.5)).toBe(-1500);
    expect(toMilliUnits(-0.001)).toBe(-1);
  });

  it("accepts numeric strings", () => {
    expect(toMilliUnits("1.5")).toBe(1500);
    expect(toMilliUnits("100")).toBe(100000);
    expect(toMilliUnits("0")).toBe(0);
    expect(toMilliUnits("-2.5")).toBe(-2500);
  });

  it("returns 0 for empty string", () => {
    expect(toMilliUnits("")).toBe(0);
  });

  it("returns 0 for non-numeric strings", () => {
    expect(toMilliUnits("abc")).toBe(0);
    expect(toMilliUnits("hello world")).toBe(0);
  });

  it("returns 0 for partially numeric strings", () => {
    expect(toMilliUnits("12abc")).toBe(0);
    expect(toMilliUnits("3.5xyz")).toBe(0);
  });

  it("returns 0 for NaN", () => {
    expect(toMilliUnits(NaN)).toBe(0);
  });

  it("returns 0 for Infinity and -Infinity", () => {
    expect(toMilliUnits(Infinity)).toBe(0);
    expect(toMilliUnits(-Infinity)).toBe(0);
  });

  it("handles large numbers without overflow", () => {
    expect(toMilliUnits(1000000)).toBe(1_000_000_000);
  });

  it("is the inverse of fromMilliUnits for clean values", () => {
    expect(fromMilliUnits(toMilliUnits(2.75))).toBe(2.75);
    expect(fromMilliUnits(toMilliUnits(0))).toBe(0);
    expect(fromMilliUnits(toMilliUnits(100))).toBe(100);
  });
});

describe("fromMilliUnits", () => {
  it("divides by 1000 to recover the base unit", () => {
    expect(fromMilliUnits(1000)).toBe(1);
    expect(fromMilliUnits(1500)).toBe(1.5);
    expect(fromMilliUnits(2750)).toBe(2.75);
  });

  it("returns 0 for zero", () => {
    expect(fromMilliUnits(0)).toBe(0);
  });

  it("handles sub-unit milli values", () => {
    expect(fromMilliUnits(1)).toBeCloseTo(0.001, 10);
    expect(fromMilliUnits(3)).toBeCloseTo(0.003, 10);
    expect(fromMilliUnits(333)).toBeCloseTo(0.333, 10);
  });

  it("handles negative values", () => {
    expect(fromMilliUnits(-1000)).toBe(-1);
    expect(fromMilliUnits(-1500)).toBe(-1.5);
  });

  it("returns 0 for NaN", () => {
    expect(fromMilliUnits(NaN)).toBe(0);
  });

  it("returns 0 for Infinity and -Infinity", () => {
    expect(fromMilliUnits(Infinity)).toBe(0);
    expect(fromMilliUnits(-Infinity)).toBe(0);
  });

  it("handles large milli values", () => {
    expect(fromMilliUnits(1_000_000_000)).toBe(1_000_000);
  });

  it("is the inverse of toMilliUnits for integer milli values", () => {
    expect(toMilliUnits(fromMilliUnits(5000))).toBe(5000);
    expect(toMilliUnits(fromMilliUnits(1))).toBe(1);
  });
});
