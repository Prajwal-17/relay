import type {
  MonochromeRasterData,
  RasterLedgerSegments,
  RasterReceiptSegments,
  RawLedgerStatementData,
  RawReceiptData
} from "@shared/types";
import html2canvas from "html2canvas";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { RASTER_PAPER_WIDTH, RasterLedgerPaper, RasterReceiptPaper } from "./RasterThermalPaper";

export const RASTER_LUMINANCE_THRESHOLD = 210;
export const RASTER_ROW_STRIDE = 72;
export const MAX_RENDERED_RASTER_HEIGHT = 30_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

export function packMonochromePixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = RASTER_LUMINANCE_THRESHOLD
): MonochromeRasterData {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new Error("Raster pixel dimensions are invalid.");
  }
  if (pixels.length !== width * height * 4) {
    throw new Error("Raster pixel data does not match its dimensions.");
  }

  const stride = Math.ceil(width / 8);
  if (width === RASTER_PAPER_WIDTH && stride !== RASTER_ROW_STRIDE) {
    throw new Error("The 576-dot raster stride must be exactly 72 bytes.");
  }
  const packed = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = (y * width + x) * 4;
      const red = pixels[pixelOffset]!;
      const green = pixels[pixelOffset + 1]!;
      const blue = pixels[pixelOffset + 2]!;
      const alpha = pixels[pixelOffset + 3]! / 255;
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const compositedLuminance = 255 - (255 - luminance) * alpha;
      if (compositedLuminance <= threshold) {
        const packedOffset = y * stride + Math.floor(x / 8);
        packed[packedOffset] = packed[packedOffset]! | (0x80 >> (x % 8));
      }
    }
  }

  return {
    dataBase64: bytesToBase64(packed),
    width,
    height,
    stride
  };
}

async function waitForRasterFonts() {
  const weights = [500, 600, 650, 700, 750, 800];
  await Promise.all(weights.map((weight) => document.fonts.load(`${weight} 20px InterVariable`)));
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function captureRaster(node: ReactNode): Promise<MonochromeRasterData> {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  Object.assign(container.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: `${RASTER_PAPER_WIDTH}px`,
    background: "#ffffff",
    color: "#000000",
    zIndex: "-1"
  });
  document.body.append(container);
  const root = createRoot(container);

  try {
    flushSync(() => root.render(node));
    await waitForRasterFonts();
    const segment = container.querySelector<HTMLElement>("[data-raster-segment]");
    if (!segment) throw new Error("The printable raster segment could not be found.");

    const width = Math.round(segment.getBoundingClientRect().width);
    const height = Math.ceil(segment.getBoundingClientRect().height);
    if (width !== RASTER_PAPER_WIDTH) {
      throw new Error("The printable raster must be exactly 576 dots wide.");
    }
    if (height < 1 || height > MAX_RENDERED_RASTER_HEIGHT) {
      throw new Error("The printable raster height must be between 1 and 30,000 dots.");
    }

    const canvas = await html2canvas(segment, {
      backgroundColor: "#ffffff",
      scale: 1,
      width: RASTER_PAPER_WIDTH,
      height,
      windowWidth: RASTER_PAPER_WIDTH,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      useCORS: false,
      imageTimeout: 0,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll<HTMLElement>("*").forEach((element) => {
          element.style.textShadow = "none";
          element.style.filter = "none";
        });
      }
    });
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The receipt raster canvas is unavailable.");
    context.imageSmoothingEnabled = false;
    return packMonochromePixels(
      context.getImageData(0, 0, RASTER_PAPER_WIDTH, height).data,
      RASTER_PAPER_WIDTH,
      height
    );
  } finally {
    root.unmount();
    container.remove();
  }
}

export async function prepareRasterReceipt(
  receipt: RawReceiptData,
  options: { omitFooter?: boolean } = {}
): Promise<RasterReceiptSegments> {
  const body = await captureRaster(
    <RasterReceiptPaper receipt={receipt} segment="body" omitFooter={options.omitFooter ?? false} />
  );
  const afterQr = receipt.upi
    ? await captureRaster(
        <RasterReceiptPaper
          receipt={receipt}
          segment="after-qr"
          omitFooter={options.omitFooter ?? false}
        />
      )
    : undefined;
  return { body, afterQr };
}

export async function prepareRasterLedger(
  statement: RawLedgerStatementData,
  options: { includeHeader?: boolean; includeFooter?: boolean } = {}
): Promise<RasterLedgerSegments> {
  return {
    body: await captureRaster(
      <RasterLedgerPaper
        statement={statement}
        includeHeader={options.includeHeader ?? true}
        includeFooter={options.includeFooter ?? true}
      />
    )
  };
}
