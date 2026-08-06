import type { Area } from "react-easy-crop";

export const PRODUCT_IMAGE_SIZE = 768;
export const MAX_PRODUCT_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_PRODUCT_SOURCE_PIXELS = 16_000_000;
const WEBP_QUALITY = 0.9;
const SAFE_PADDING = 48;

export type ProductImageDimensions = {
  width: number;
  height: number;
};

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("The image could not be decoded.")), {
      once: true
    });
    image.src = url;
  });

const canvasToWebpBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not prepare the product image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      WEBP_QUALITY
    );
  });

async function rejectsAnimation(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const chunkName = (offset: number) =>
    String.fromCharCode(bytes[offset]!, bytes[offset + 1]!, bytes[offset + 2]!, bytes[offset + 3]!);

  if (blob.type === "image/webp") {
    for (let offset = 12; offset + 8 <= bytes.length; ) {
      const name = chunkName(offset);
      if (name === "ANIM" || name === "ANMF") {
        throw new Error("Animated WebP images are not supported.");
      }
      const length = view.getUint32(offset + 4, true);
      offset += 8 + length + (length % 2);
    }
  }

  if (blob.type === "image/png") {
    for (let offset = 8; offset + 12 <= bytes.length; ) {
      const length = view.getUint32(offset, false);
      if (chunkName(offset + 4) === "acTL") {
        throw new Error("Animated PNG images are not supported.");
      }
      offset += 12 + length;
    }
  }
}

export async function validateProductImageBlob(blob: Blob): Promise<ProductImageDimensions> {
  if (blob.type === "image/svg+xml" || (blob.type && !blob.type.startsWith("image/"))) {
    throw new Error("Choose a photo or product image.");
  }
  if (blob.size === 0) throw new Error("The selected image is empty.");
  if (blob.size > MAX_PRODUCT_SOURCE_BYTES) {
    throw new Error("This image is too large to use. Choose another image.");
  }

  await rejectsAnimation(blob);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("The selected file is not a valid image.");
  }

  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  if (
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    dimensions.width * dimensions.height > MAX_PRODUCT_SOURCE_PIXELS
  ) {
    throw new Error("This image is too large to use. Choose another image.");
  }
  return dimensions;
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read product image."));
        return;
      }
      resolve(reader.result);
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("Could not read product image."))
    );
    reader.readAsDataURL(blob);
  });

export async function getCroppedImageBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the product image.");

  canvas.width = PRODUCT_IMAGE_SIZE;
  canvas.height = PRODUCT_IMAGE_SIZE;
  context.clearRect(0, 0, PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE);
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    PRODUCT_IMAGE_SIZE,
    PRODUCT_IMAGE_SIZE
  );
  return canvasToWebpBlob(canvas);
}

export async function getFittedImageBlob(imageSrc: string): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the product image.");

  canvas.width = PRODUCT_IMAGE_SIZE;
  canvas.height = PRODUCT_IMAGE_SIZE;
  context.clearRect(0, 0, PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE);

  const available = PRODUCT_IMAGE_SIZE - SAFE_PADDING * 2;
  const scale = Math.min(available / image.naturalWidth, available / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(
    image,
    (PRODUCT_IMAGE_SIZE - width) / 2,
    (PRODUCT_IMAGE_SIZE - height) / 2,
    width,
    height
  );
  return canvasToWebpBlob(canvas);
}
