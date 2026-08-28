import { describe, expect, it } from "vitest";
import type { MonochromeRasterData } from "../../../../shared/types";
import { escPosCommands } from "../../../ipcHandlers/printHandlers/escposCommands";
import {
  buildGsV0Raster,
  validateMonochromeRasterData
} from "../../../ipcHandlers/printHandlers/raster";

function raster(height = 1): MonochromeRasterData {
  const data = Buffer.alloc(72 * height);
  for (let index = 0; index < data.length; index += 1) data[index] = index & 0xff;
  return {
    dataBase64: data.toString("base64"),
    width: 576,
    height,
    stride: 72
  };
}

describe("GS v 0 raster command", () => {
  it("encodes the command prefix and low/high dimension bytes", () => {
    expect(escPosCommands.gsV0RasterHeader(300, 513)).toEqual(
      Buffer.from([0x1d, 0x76, 0x30, 0x00, 0x2c, 0x01, 0x01, 0x02])
    );
  });

  it("uses the production 576-dot width and 72-byte stride", () => {
    const payload = buildGsV0Raster(raster());
    expect(payload.subarray(0, 8)).toEqual(Buffer.from([0x1d, 0x76, 0x30, 0x00, 72, 0, 1, 0]));
    expect(payload).toHaveLength(8 + 72);
  });

  it("splits tall rasters into ordered 256-row chunks without changing bytes", () => {
    const value = raster(300);
    const source = Buffer.from(value.dataBase64, "base64");
    const payload = buildGsV0Raster(value);
    const firstDataEnd = 8 + 72 * 256;

    expect(payload.subarray(0, 8)).toEqual(Buffer.from([0x1d, 0x76, 0x30, 0x00, 72, 0, 0, 1]));
    expect(payload.subarray(firstDataEnd, firstDataEnd + 8)).toEqual(
      Buffer.from([0x1d, 0x76, 0x30, 0x00, 72, 0, 44, 0])
    );
    expect(
      Buffer.concat([payload.subarray(8, firstDataEnd), payload.subarray(firstDataEnd + 8)])
    ).toEqual(source);
  });
});

describe("raster payload validation", () => {
  it("accepts exact production dimensions and decoded length", () => {
    expect(() => validateMonochromeRasterData(raster(30_000))).not.toThrow();
  });

  it.each([
    ["width", { width: 575 }],
    ["stride", { stride: 71 }],
    ["zero height", { height: 0 }],
    ["excessive height", { height: 30_001 }],
    ["fractional height", { height: 1.5 }],
    ["base64", { dataBase64: "@@not-base64@@" }],
    ["decoded length", { dataBase64: Buffer.alloc(71).toString("base64") }]
  ])("rejects invalid %s", (_label, override) => {
    expect(() => validateMonochromeRasterData({ ...raster(), ...override })).toThrow();
  });
});
