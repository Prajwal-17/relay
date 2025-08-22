import { desc, eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type {
  ApiResponse,
  EstimateItemsType,
  EstimatePayload,
  EstimateType
} from "../../shared/types";
import { db } from "../db/db";
import { estimateItems, estimates } from "../db/schema";

export function estimatesHandlers() {
  ipcMain.handle("estimatesApi:getNextEstimateNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastEstimate = await db
        .select()
        .from(estimates)
        .orderBy(desc(estimates.createdAt))
        .limit(1);
      const lastEstimateNo = lastEstimate[0].estimateNo;
      let nextEstimateNo = 1;

      if (lastEstimateNo) {
        nextEstimateNo = lastEstimateNo + 1;
      }

      return { status: "success", data: nextEstimateNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next estimate number" } };
    }
  });

  ipcMain.handle("estimatesApi:getAllEstimates", async (): Promise<ApiResponse<EstimateType[]>> => {
    try {
      const estimatesArray = await db.select().from(estimates).orderBy(desc(estimates.createdAt));

      return { status: "success", data: estimatesArray };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve estimates" } };
    }
  });

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
            items: estimateItemsList
          }
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Failed to retrieve estimate" } };
      }
    }
  );

  ipcMain.handle(
    "estimatesApi:save",
    async (_event, estimateObj: EstimatePayload): Promise<ApiResponse<string>> => {
      try {
        // --- CREATE ESTIMATE ---
        if (!estimateObj.billingId) {
          const result = db.transaction((tx) => {
            const estimate = tx
              .insert(estimates)
              .values({
                estimateNo: Number(estimateObj.estimateNo),
                customerName: "DEFAULT",
                grandTotal: estimateObj.grandTotal,
                isPaid: true
              })
              .returning({ id: estimates.id })
              .get();

            if (!estimate || !estimate.id) {
              throw new Error("EstimateCreationFailure");
            }

            for (const item of estimateObj.items) {
              if (!item.name || !item.productId) {
                continue;
              }

              tx.insert(estimateItems)
                .values({
                  estimateId: estimate.id,
                  productId: item.productId,
                  name: item.name,
                  mrp: item.mrp,
                  price: item.price,
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                })
                .run();
            }
            return "Estimate saved successfully";
          });
          return { status: "success", data: result };
        }
        // --- UPDATE ESTIMATE ---
        else {
          const result = db.transaction((tx) => {
            if (!estimateObj.billingId) {
              throw new Error("MissingBillingId");
            }

            const estimate = tx
              .select()
              .from(estimates)
              .where(eq(estimates.id, estimateObj.billingId))
              .get();

            if (!estimate || !estimate.id) {
              throw new Error("NoEstimateFound");
            }

            tx.update(estimates)
              .set({
                customerName: estimateObj.customerName,
                customerContact: estimateObj.customerContact,
                grandTotal: estimateObj.grandTotal,
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                updatedAt: sql`(datenow('now'))`
              })
              .where(eq(estimates.id, estimateObj.billingId))
              .run();

            tx.delete(estimateItems).where(eq(estimateItems.estimateId, estimate.id)).run();

            for (const item of estimateObj.items) {
              if (!item.name) {
                continue;
              }
              tx.insert(estimateItems)
                .values({
                  estimateId: estimate.id,
                  productId: item.productId,
                  name: item.name,
                  mrp: item.mrp,
                  price: item.price,
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                })
                .run();
            }
            return "Estimate updated successfully";
          });
          return { status: "success", data: result };
        }
      } catch (error) {
        console.error("Error in estimatesApi:save transaction:", error);

        if (error instanceof Error) {
          if (error.message === "EstimateCreationFailure") {
            return {
              status: "error",
              error: { message: "Could not create the estimate record in the database." }
            };
          }
          if (error.message === "MissingBillingId") {
            return { status: "error", error: { message: "Billing ID is missing for the update." } };
          }
          if (error.message === "NoEstimateFound") {
            return {
              status: "error",
              error: { message: "The estimate you are trying to update could not be found." }
            };
          }
        }

        return {
          status: "error",
          error: { message: "An error occurred while saving the estimate." }
        };
      }
    }
  );
}
