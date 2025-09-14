import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function deleteEstimate() {
  // delete a estimate
  ipcMain.handle(
    "estimatesApi:deleteEstimate",
    async (_event, estimateId): Promise<ApiResponse<string>> => {
      try {
        if (!estimateId) {
          return {
            status: "error",
            error: {
              message: "Estimates does not exist"
            }
          };
        }

        const result = await db.delete(estimates).where(eq(estimates.id, estimateId));

        if (result.changes > 0) {
          return { status: "success", data: "Estimate deleted successfully" };
        }

        return {
          status: "error",
          error: {
            message: "Estimate not found.Could be already deleted"
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: "Something went wrong in estimates api"
          }
        };
      }
    }
  );
}
