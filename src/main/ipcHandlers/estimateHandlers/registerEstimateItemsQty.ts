import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import { UPDATE_QTY_ACTION, type ApiResponse, type UpdateQtyAction } from "../../../shared/types";
import { db } from "../../db/db";
import { estimateItems } from "../../db/schema";

export function registerEstimateItemQty() {
  ipcMain.handle(
    "estimatesApi:updateCheckedQuantity",
    async (
      _event,
      estimateItemId: string,
      action: UpdateQtyAction
    ): Promise<ApiResponse<string>> => {
      try {
        if (!estimateItemId || !action) {
          throw new Error("Invalid parameters");
        }

        db.transaction((tx) => {
          const item = tx
            .select()
            .from(estimateItems)
            .where(eq(estimateItems.id, estimateItemId))
            .get();

          if (!item) {
            throw new Error("Estimate Item not found");
          }

          let updatedQty = item.checkedQty ?? 0;
          const totalQty = item.quantity;

          // remainder to get the decimal values
          const remainder = parseFloat((totalQty % 1).toFixed(2));

          if (action === UPDATE_QTY_ACTION.SET) {
            updatedQty = item.checkedQty === item.quantity ? 0 : item.quantity;
          } else if (action === UPDATE_QTY_ACTION.INCREMENT) {
            const nextQty = updatedQty + 1;
            if (nextQty > totalQty) {
              const remainderQty = updatedQty + remainder;
              if (remainderQty <= totalQty) {
                updatedQty = remainderQty;
              } else {
                updatedQty = totalQty;
              }
            } else {
              updatedQty = nextQty;
            }
          } else if (action === UPDATE_QTY_ACTION.DECREMENT) {
            const nextQty = updatedQty - 1;
            const remainder = parseFloat((updatedQty % 1).toFixed(2));
            if (remainder !== 0 && updatedQty === totalQty) {
              updatedQty = Math.floor(updatedQty);
            } else {
              updatedQty = Math.max(0, nextQty);
            }
          }

          // round to 2 decimals
          updatedQty = Math.round(updatedQty * 100) / 100;

          tx.update(estimateItems)
            .set({
              checkedQty: updatedQty
            })
            .where(eq(estimateItems.id, estimateItemId))
            .run();
        });

        return {
          status: "success",
          data: "Successfully updated checked quantity of item."
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message:
              (error as Error).message ?? "Something went wrong while updating quantity of item."
          }
        };
      }
    }
  );
}
