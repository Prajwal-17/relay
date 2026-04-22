import { app, ipcMain } from "electron/main";
import fs from "node:fs";
import path from "node:path";
import type { ApiResponse } from "../../../shared/types";

const userDataPath = app.getPath("userData");
const imagesDir = path.join(userDataPath, "product-images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export function saveProductImage() {
  ipcMain.handle(
    "products:saveProductImage",
    async (_event, dataUrl: string): Promise<ApiResponse<{ url: string }>> => {
      try {
        const match = dataUrl.match(/^data:image\/webp;base64,(.+)$/);

        if (!match) {
          throw new Error("Invalid image data. Product images must be saved as WebP.");
        }

        const [, base64Data] = match;
        const fileName = `${crypto.randomUUID()}.webp`;
        const destPath = path.join(imagesDir, fileName);

        await fs.promises.writeFile(destPath, Buffer.from(base64Data, "base64"));

        return {
          status: "success",
          data: {
            url: fileName
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message || "Something went wrong while saving image."
          }
        };
      }
    }
  );
}
