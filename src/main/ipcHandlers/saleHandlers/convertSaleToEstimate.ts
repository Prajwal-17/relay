import { desc, eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { estimateItems, estimates, sales } from "../../db/schema";

export function convertSaletoEstimate() {
  // Convert a sale to estimate
  ipcMain.handle(
    "salesApi:convertSaletoEstimate",
    async (_event, saleId): Promise<ApiResponse<string>> => {
      try {
        if (!saleId) {
          return {
            status: "error",
            error: {
              message: "Sales does not exist"
            }
          };
        }

        const saleObj = await db.query.sales.findFirst({
          where: eq(sales.id, saleId),
          with: {
            customer: true,
            saleItems: true
          }
        });

        if (!saleObj) {
          return {
            status: "error",
            error: {
              message: "Sales does not exist"
            }
          };
        }

        const lastEstimate = await db
          .select()
          .from(estimates)
          .orderBy(desc(estimates.estimateNo))
          .limit(1);
        const lastEstimateNo = lastEstimate[0]?.estimateNo;
        let nextEstimateNo = 1;

        if (nextEstimateNo) {
          nextEstimateNo = lastEstimateNo + 1;
        }

        db.transaction((tx) => {
          const estimate = tx
            .insert(estimates)
            .values({
              estimateNo: nextEstimateNo,
              customerId: saleObj.customerId,
              grandTotal: saleObj.grandTotal,
              totalQuantity: saleObj.totalQuantity,
              isPaid: !saleObj.isPaid
            })
            .returning({ id: estimates.id })
            .get();

          if (!estimate.id) {
            throw new Error("Failed to insert estimate");
          }

          /**
           * @returns {{ changes: number, lastInsertRowid: number }[]}
           */
          const insertItems = saleObj.saleItems.map((i) =>
            tx
              .insert(estimateItems)
              .values({
                estimateId: estimate.id,
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

          if (insertItems.length !== saleObj.saleItems.length) {
            return;
          }

          if (!estimate?.id) {
            throw new Error("Failed to insert estimate");
          }

          const deleteSale = tx.delete(sales).where(eq(sales.id, saleId)).run();

          if (deleteSale.changes <= 0) {
            throw new Error("Failed to delete sale during conversion");
          }

          return "Sale converted successfully";
        });

        return { status: "success", data: "Successfully converted sales to estimate" };
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
