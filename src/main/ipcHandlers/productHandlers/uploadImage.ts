import { app, dialog, ipcMain } from "electron/main";
import fs from "node:fs";
import path from "node:path";
import type { ApiResponse } from "../../../shared/types";

const userDataPath = app.getPath("userData");
const imagesDir = path.join(userDataPath, "product-images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export async function openDialogAndSaveImage() {
  ipcMain.handle(
    "dialog:openDialogAndSaveImage",
    async (): Promise<ApiResponse<{ url: string }>> => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ["openFile"],
          filters: [
            {
              name: "Product-Images",
              extensions: ["png", "jpg", "webp", "jpeg"]
            }
          ]
        });

        if (canceled || filePaths.length === 0) {
          throw new Error("Image path does not exits. Please try again.");
        }

        const sourcePath = filePaths[0];
        const ext = path.extname(sourcePath);
        const fileName = `${crypto.randomUUID()}${ext}`;
        const destPath = path.join(imagesDir, fileName);

        await fs.promises.copyFile(sourcePath, destPath);

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
            message: (error as Error).message || "Something went wrong while uploading image."
          }
        };
      }
    }
  );
}
