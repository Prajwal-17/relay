import type { Area } from "react-easy-crop";

const WEBP_QUALITY = 0.9;
const CANVAS_BACKGROUND = "#230234";

const createImage = (url: string) =>
  // promise based image loader
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = url;
  });

const canvasToWebpBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not prepare image crop."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      WEBP_QUALITY
    );
  });

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

  if (!context) {
    throw new Error("Could not prepare image crop.");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  context.fillStyle = CANVAS_BACKGROUND;
  context.fillRect(0, 0, crop.width, crop.height);

  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return canvasToWebpBlob(canvas);
}

export async function getFittedImageBlob(imageSrc: string): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image.");
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  context.fillStyle = CANVAS_BACKGROUND;
  context.fillRect(0, 0, image.naturalWidth, image.naturalHeight);

  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

  return canvasToWebpBlob(canvas);
}

// to get dynamic image aspect ratio - for uneven images(tall, wide)
export async function getImageAspectRatio(imageSrc: string): Promise<number> {
  const image = await createImage(imageSrc);

  return image.naturalWidth / image.naturalHeight;
}
