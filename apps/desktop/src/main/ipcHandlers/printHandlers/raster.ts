import type {
  MonochromeRasterData,
  RasterLedgerSegments,
  RasterReceiptSegments
} from "../../../shared/types";
import { escPosCommands } from "./escposCommands";

export const RASTER_PRINT_WIDTH = 576;
export const RASTER_PRINT_STRIDE = 72;
export const MAX_RASTER_HEIGHT = 30_000;
export const RASTER_CHUNK_HEIGHT = 256;

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function validateMonochromeRasterData(
  raster: unknown
): asserts raster is MonochromeRasterData {
  if (!raster || typeof raster !== "object") {
    throw new Error("Raster image data is required.");
  }

  const value = raster as Partial<MonochromeRasterData>;
  if (value.width !== RASTER_PRINT_WIDTH) {
    throw new Error("Raster width must be exactly 576 dots.");
  }
  if (value.stride !== RASTER_PRINT_STRIDE) {
    throw new Error("Raster stride must be exactly 72 bytes.");
  }
  if (
    !Number.isInteger(value.height) ||
    value.height == null ||
    value.height < 1 ||
    value.height > MAX_RASTER_HEIGHT
  ) {
    throw new Error("Raster height must be between 1 and 30,000 dots.");
  }
  if (
    typeof value.dataBase64 !== "string" ||
    value.dataBase64.length === 0 ||
    value.dataBase64.length % 4 !== 0 ||
    !BASE64_PATTERN.test(value.dataBase64)
  ) {
    throw new Error("Raster image data must be valid base64.");
  }

  const decoded = Buffer.from(value.dataBase64, "base64");
  if (decoded.length !== RASTER_PRINT_STRIDE * value.height) {
    throw new Error("Raster image byte length does not match its dimensions.");
  }
}

export function validateRasterReceiptSegments(
  raster: unknown,
  requiresQr: boolean
): asserts raster is RasterReceiptSegments {
  if (!raster || typeof raster !== "object") {
    throw new Error("Receipt raster data is required.");
  }
  const value = raster as Partial<RasterReceiptSegments>;
  validateMonochromeRasterData(value.body);
  if (requiresQr && !value.qr) {
    throw new Error("A freshly generated payment QR raster is required.");
  }
  if (requiresQr && !value.afterQr) {
    throw new Error("The receipt raster after-QR segment is required.");
  }
  if (value.qr !== undefined) validateMonochromeRasterData(value.qr);
  if (value.afterQr !== undefined) validateMonochromeRasterData(value.afterQr);
}

export function getValidatedReceiptQrRaster(
  raster: unknown,
  requiresQr: boolean
): MonochromeRasterData | undefined {
  if (!requiresQr) return undefined;
  if (!raster || typeof raster !== "object") {
    throw new Error("A freshly generated payment QR raster is required.");
  }
  const qr = (raster as Partial<RasterReceiptSegments>).qr;
  if (!qr) throw new Error("A freshly generated payment QR raster is required.");
  validateMonochromeRasterData(qr);
  return qr;
}

export function validateRasterLedgerSegments(
  raster: unknown
): asserts raster is RasterLedgerSegments {
  if (!raster || typeof raster !== "object") {
    throw new Error("Ledger raster data is required.");
  }
  const value = raster as Partial<RasterLedgerSegments>;
  validateMonochromeRasterData(value.body);
}

export function buildGsV0Raster(raster: MonochromeRasterData): Buffer {
  validateMonochromeRasterData(raster);
  const data = Buffer.from(raster.dataBase64, "base64");
  const chunks: Buffer[] = [];

  for (let row = 0; row < raster.height; row += RASTER_CHUNK_HEIGHT) {
    const chunkHeight = Math.min(RASTER_CHUNK_HEIGHT, raster.height - row);
    const start = row * raster.stride;
    const end = start + chunkHeight * raster.stride;
    chunks.push(
      escPosCommands.gsV0RasterHeader(raster.stride, chunkHeight),
      data.subarray(start, end)
    );
  }

  return Buffer.concat(chunks);
}
