import { desc, eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimates, saleItems, sales } from "../../db/schema";

export function convertEstimateToSale() {
  // Convert a estimate to sale
  ipcMain.handle(
    "estimatesApi:convertEstimateToSale",
    async (_event, estimateId): Promise<ApiResponse<string>> => {
      try {
        if (!estimateId) {
          return {
            status: "error",
            error: {
              message: "Estimate does not exist"
            }
          };
        }

        const estimateObj = await db.query.estimates.findFirst({
          where: eq(estimates.id, estimateId),
          with: {
            estimateItems: true
          }
        });

        if (!estimateObj) {
          return {
            status: "error",
            error: {
              message: "Estimate does not exist"
            }
          };
        }

        const lastSale = await db.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1);
        const lastSaleNo = lastSale[0]?.invoiceNo;
        let nextSaleNo = 1;

        if (nextSaleNo) {
          nextSaleNo = lastSaleNo + 1;
        }

        db.transaction((tx) => {
          const sale = tx
            .insert(sales)
            .values({
              invoiceNo: nextSaleNo,
              customerId: estimateObj.customerId,
              grandTotal: estimateObj.grandTotal,
              totalQuantity: estimateObj.totalQuantity,
              isPaid: !estimateObj.isPaid
            })
            .returning({ id: estimates.id })
            .get();

          // since it is db call use throw to exit db call & rollback
          if (!sale.id) {
            throw new Error("Failed to insert sale");
          }

          /**
           * @returns {{ changes: number, lastInsertRowid: number }[]}
           */
          const insertItems = estimateObj.estimateItems.map((i) =>
            tx
              .insert(saleItems)
              .values({
                saleId: sale.id,
                productId: i.productId,
                name: i.name,
                mrp: i.mrp,
                price: i.price,
                weight: i.weight,
                unit: i.unit,
                quantity: i.quantity,
                totalPrice: i.totalPrice
              })
              .run()
          );

          if (insertItems.length !== estimateObj.estimateItems.length) {
            return;
          }

          if (!estimates?.id) {
            throw new Error("Failed to insert sale items");
          }

          const deleteEstimate = tx.delete(estimates).where(eq(estimates.id, estimateId)).run();

          if (deleteEstimate.changes <= 0) {
            throw new Error("Failed to delete estimate during conversion");
          }

          return "Estimate converted successfully";
        });

        return { status: "success", data: "Successfully converted estimate to sale" };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Something went wrong"
          }
        };
      }
    }
  );
}
