// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { packMonochromePixels } from "./thermalRaster";

function pixels(values: Array<[number, number, number, number]>): Uint8ClampedArray {
  return new Uint8ClampedArray(values.flat());
}

function decode(dataBase64: string) {
  return Uint8Array.from(window.atob(dataBase64), (character) => character.charCodeAt(0));
}

function whitePixels(count: number) {
  return pixels(
    Array.from({ length: count }, () => [255, 255, 255, 255] as [number, number, number, number])
  );
}

describe("one-bit thermal raster packing", () => {
  it("keeps pure white pixels as zero bits", () => {
    const result = packMonochromePixels(whitePixels(8), 8, 1);
    expect(decode(result.dataBase64)).toEqual(Uint8Array.of(0));
  });

  it("sets black pixels from left to right in most-significant-bit order", () => {
    const row = Array.from({ length: 8 }, (_, index) =>
      index === 0 || index === 2 || index === 7 ? [0, 0, 0, 255] : [255, 255, 255, 255]
    ) as Array<[number, number, number, number]>;
    expect(decode(packMonochromePixels(pixels(row), 8, 1).dataBase64)).toEqual(Uint8Array.of(0xa1));
  });

  it("calculates stride for non-byte-aligned helper widths", () => {
    const row = Array.from({ length: 9 }, (_, index) =>
      index === 0 || index === 8 ? [0, 0, 0, 255] : [255, 255, 255, 255]
    ) as Array<[number, number, number, number]>;
    const result = packMonochromePixels(pixels(row), 9, 1);
    expect(result.stride).toBe(2);
    expect(decode(result.dataBase64)).toEqual(Uint8Array.of(0x80, 0x80));
  });

  it("uses exactly 576 dots and 72 bytes per production row", () => {
    const result = packMonochromePixels(whitePixels(576), 576, 1);
    expect(result).toMatchObject({ width: 576, height: 1, stride: 72 });
    expect(decode(result.dataBase64)).toHaveLength(72);
  });
});
