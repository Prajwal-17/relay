import { desc } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, EstimateType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function getAllEstimates() {
  ipcMain.handle("estimatesApi:getAllEstimates", async (): Promise<ApiResponse<EstimateType[]>> => {
    try {
      const estimatesArray = await db.select().from(estimates).orderBy(desc(estimates.createdAt));

      return {
        status: "success",
        data: estimatesArray.map((estimate: EstimateType) => {
          return {
            ...estimate,
            grandTotal: estimate.grandTotal && formatToRupees(estimate.grandTotal)
          };
        })
      };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve estimates" } };
    }
  });
}
