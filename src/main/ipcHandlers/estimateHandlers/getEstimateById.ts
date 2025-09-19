import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, EstimateItemsType, EstimateType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function getEstimateById() {
  ipcMain.handle(
    "estimatesApi:getTransactionById",
    async (
      _event,
      id: string
    ): Promise<ApiResponse<EstimateType & { items: EstimateItemsType[] }>> => {
      try {
        const estimateObj = await db.query.estimates.findFirst({
          where: eq(estimates.id, id),
          with: {
            customer: true,
            estimateItems: true
          }
        });

        if (!estimateObj) {
          throw new Error(`Could not find estimate with ${id}`);
        }

        return {
          status: "success",
          data: {
            ...estimateObj,
            items: estimateObj.estimateItems.map((item) => {
              return {
                ...item,
                mrp: item.mrp && formatToRupees(item.mrp),
                price: formatToRupees(item.price),
                totalPrice: formatToRupees(item.totalPrice)
              };
            })
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: (error as any).message ?? "Failed to retrieve estimate" }
        };
      }
    }
  );
}
