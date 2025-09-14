import { desc } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function getNextEstimateNo() {
  ipcMain.handle("estimatesApi:getNextEstimateNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastEstimate = await db
        .select()
        .from(estimates)
        .orderBy(desc(estimates.estimateNo))
        .limit(1);
      const lastEstimateNo = lastEstimate[0]?.estimateNo;
      let nextEstimateNo = 1;

      if (lastEstimateNo) {
        nextEstimateNo = lastEstimateNo + 1;
      }

      return { status: "success", data: nextEstimateNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next estimate number" } };
    }
  });
}
