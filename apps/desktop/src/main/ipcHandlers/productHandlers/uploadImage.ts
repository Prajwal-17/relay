import { app, ipcMain } from "electron/main";
import fs from "node:fs";
import path from "node:path";
import { validate as isUuid, v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "../../../shared/types";

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const WEBP_DATA_URL = /^data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})$/;

function getImagesDirectory() {
  return path.join(app.getPath("userData"), "product-images");
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function getImageId(value: string) {
  const imageId = value.endsWith(".webp") ? value.slice(0, -5) : value;
  if (!isUuid(imageId)) {
    throw new Error("Invalid product image ID.");
  }
  return imageId;
}

async function removeImageFile(imageId: string) {
  const fileName = `${getImageId(imageId)}.webp`;
  try {
    await fs.promises.unlink(path.join(getImagesDirectory(), fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function registerProductImageHandlers() {
  ipcMain.handle(
    "products:saveProductImage",
    async (_event, dataUrl: string): Promise<ApiResponse<{ id: string }>> => {
      let temporaryPath: string | null = null;

      try {
        if (typeof dataUrl !== "string" || dataUrl.length > MAX_PRODUCT_IMAGE_BYTES * 1.5) {
          throw new Error("Product image payload is too large.");
        }
        const match = WEBP_DATA_URL.exec(dataUrl);
        if (!match) {
          throw new Error("Invalid image data. Product images must be saved as WebP.");
        }

        const imageBuffer = Buffer.from(match[1]!, "base64");
        if (imageBuffer.length === 0 || imageBuffer.length > MAX_PRODUCT_IMAGE_BYTES) {
          throw new Error("Product image must be smaller than 5 MB.");
        }
        if (!isWebp(imageBuffer)) {
          throw new Error("Invalid WebP image data.");
        }

        const imagesDirectory = getImagesDirectory();
        await fs.promises.mkdir(imagesDirectory, { recursive: true });

        const imageId = uuidv4();
        temporaryPath = path.join(imagesDirectory, `${imageId}.tmp`);
        const destinationPath = path.join(imagesDirectory, `${imageId}.webp`);

        await fs.promises.writeFile(temporaryPath, imageBuffer, { flag: "wx" });
        await fs.promises.rename(temporaryPath, destinationPath);
        temporaryPath = null;

        return { status: "success", data: { id: imageId } };
      } catch (error) {
        if (temporaryPath) {
          await fs.promises.unlink(temporaryPath).catch((cleanupError) => {
            console.error("Failed to remove temporary product image", cleanupError);
          });
        }
        return {
          status: "error",
          error: {
            message: (error as Error).message || "Something went wrong while saving image."
          }
        };
      }
    }
  );

  ipcMain.handle(
    "products:deleteProductImage",
    async (_event, imageId: string): Promise<ApiResponse<null>> => {
      try {
        await removeImageFile(imageId);
        return { status: "success", data: null };
      } catch (error) {
        return {
          status: "error",
          error: {
            message: (error as Error).message || "Could not delete product image."
          }
        };
      }
    }
  );
}
