import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, CustomersType, SaleItemsType, SalesType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function getSaleById() {
  //get sale by id
  ipcMain.handle(
    "salesApi:getTransactionById",
    async (
      _event,
      id: string
    ): Promise<ApiResponse<SalesType & { customer: CustomersType; items: SaleItemsType[] }>> => {
      try {
        const saleObj = await db.query.sales.findFirst({
          where: eq(sales.id, id),
          with: {
            customer: true,
            saleItems: true
          }
        });

        if (!saleObj) {
          throw new Error(`Could not find sale with ${id}`);
        }

        return {
          status: "success",
          data: {
            id: saleObj.id,
            invoiceNo: saleObj.invoiceNo,
            customerId: saleObj.customerId,
            customer: saleObj.customer,
            grandTotal: saleObj.grandTotal && formatToRupees(saleObj.grandTotal),
            totalQuantity: saleObj.totalQuantity,
            isPaid: saleObj.isPaid,
            items: saleObj.saleItems.map((item) => {
              return {
                ...item,
                mrp: item.mrp && formatToRupees(item.mrp),
                price: formatToRupees(item.price),
                totalPrice: formatToRupees(item.totalPrice),
                checkedQty: item.checkedQty ?? 0
              };
            }),
            updatedAt: saleObj.updatedAt,
            createdAt: saleObj.createdAt
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: (error as Error).message ?? "Failed to retrieve sales" }
        };
      }
    }
  );
}
