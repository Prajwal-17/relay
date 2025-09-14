import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, SaleItemsType, SalesType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { saleItems, sales } from "../../db/schema";

export function getSaleById() {
  //get sale by id
  ipcMain.handle(
    "salesApi:getTransactionById",
    async (_event, id: string): Promise<ApiResponse<SalesType & { items: SaleItemsType[] }>> => {
      try {
        const [saleRecord] = await db.select().from(sales).where(eq(sales.id, id));
        const saleItemsList = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
        return {
          status: "success",
          data: {
            ...saleRecord,
            items: saleItemsList.map((item) => {
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
        return { status: "error", error: { message: "Failed to retrieve sales" } };
      }
    }
  );
}
