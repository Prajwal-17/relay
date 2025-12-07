import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type UnifiedTransaction,
  type UnifiedTransactionItem,
  type UnifiedTransctionWithItems
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function getSaleById() {
  //get sale by id
  ipcMain.handle(
    "salesApi:getTransactionById",
    async (_event, id: string): Promise<ApiResponse<UnifiedTransctionWithItems>> => {
      try {
        const result = await db.query.sales.findFirst({
          where: eq(sales.id, id),
          with: {
            customer: true,
            saleItems: true
          }
        });

        if (!result) {
          throw new Error(`Could not find sale with ${id}`);
        }

        const unifiedTransaction: UnifiedTransaction = {
          type: TRANSACTION_TYPE.SALE,
          id: result.id,
          transactionNo: result.invoiceNo,
          customerId: result.customerId,
          customer: result.customer,
          grandTotal: result.grandTotal && formatToRupees(result.grandTotal),
          totalQuantity: result.totalQuantity,
          isPaid: result.isPaid,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        };

        const unifiedItems: UnifiedTransactionItem[] = result.saleItems.map((item) => {
          return {
            id: item.id,
            parentId: item.saleId,
            productId: item.productId,
            name: item.name,
            productSnapshot: item.productSnapshot,
            weight: item.weight,
            unit: item.unit,
            price: item.price,
            mrp: item.mrp,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            purchasePrice: item.purchasePrice,
            checkedQty: item.checkedQty ?? 0
          };
        });

        return {
          status: "success",
          data: {
            ...unifiedTransaction,
            items: unifiedItems
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
