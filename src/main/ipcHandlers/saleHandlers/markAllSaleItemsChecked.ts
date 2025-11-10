import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import { BATCH_CHECK_ACTION, type ApiResponse, type BatchCheckAction } from "../../../shared/types";
import { db } from "../../db/db";
import { saleItems } from "../../db/schema";

export function markAllSaleItemsChecked() {
  ipcMain.handle(
    "salesApi:markAllSaleItemsChecked",
    async (
      _event,
      saleId: string,
      action: BatchCheckAction
    ): Promise<ApiResponse<{ isAllChecked: boolean }>> => {
      try {
        const setCheckedQty =
          action === BATCH_CHECK_ACTION.MARK_ALL ? sql`${saleItems.quantity}` : 0;

        const result = db
          .update(saleItems)
          .set({
            checkedQty: setCheckedQty
          })
          .where(eq(saleItems.saleId, saleId))
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
        throw new Error("No Sale Items were updated");
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Error While marking sale items."
          }
        };
      }
    }
  );
}
