import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import { BATCH_CHECK_ACTION, type ApiResponse, type BatchCheckAction } from "../../../shared/types";
import { db } from "../../db/db";
import { estimateItems } from "../../db/schema";

export function markAllEstimateItemsChecked() {
  ipcMain.handle(
    "estimatesApi:markAllEstimateItemsChecked",
    async (
      _event,
      estimateId: string,
      action: BatchCheckAction
    ): Promise<ApiResponse<{ isAllChecked: boolean }>> => {
      try {
        const setCheckedQty =
          action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${estimateItems.quantity}` : 0;

        const result = db
          .update(estimateItems)
          .set({
            checkedQty: setCheckedQty
          })
          .where(eq(estimateItems.estimateId, estimateId))
          .run();

        if (result.changes > 0) {
          return {
            status: "success",
            data: {
              isAllChecked: action === BATCH_CHECK_ACTION.MARK_ALL
            },
            message:
              action === BATCH_CHECK_ACTION.MARK_ALL
                ? "All items have been marked as checked."
                : "All items have been unchecked."
          };
        }
        throw new Error("No Estimate Items were updated");
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Error While marking estimate items."
          }
        };
      }
    }
  );
}
