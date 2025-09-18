import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, EstimateItemsType, EstimateType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimateItems, estimates } from "../../db/schema";

export function getEstimateById() {
  ipcMain.handle(
    "estimatesApi:getTransactionById",
    async (
      _event,
      id: string
    ): Promise<ApiResponse<EstimateType & { items: EstimateItemsType[] }>> => {
      try {
        const [estimateRecord] = await db.select().from(estimates).where(eq(estimates.id, id));
        const estimateItemsList = await db
          .select()
          .from(estimateItems)
          .where(eq(estimateItems.estimateId, id));

        return {
          status: "success",
          data: {
            ...estimateRecord,
            items: estimateItemsList.map((item) => {
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
        return { status: "error", error: { message: "Failed to retrieve estimate" } };
      }
    }
  );
}
