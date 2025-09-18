import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type EstimatePayload,
  type TransactionType
} from "../../../shared/types";
import { removeTandZ } from "../../../shared/utils/dateUtils";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { Role } from "../../db/enum";
import { customers, estimateItems, estimates } from "../../db/schema";

export function saveEstimate() {
  ipcMain.handle(
    "estimatesApi:save",
    async (
      _event,
      estimateObj: EstimatePayload
    ): Promise<ApiResponse<{ id: string; type: TransactionType }>> => {
      try {
        let customer;
        if (!estimateObj.customerName) {
          customer = await db.select().from(customers).where(eq(customers.name, "DEFAULT"));
        } else if (estimateObj.customerId && estimateObj.customerName) {
          customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, estimateObj.customerId));
        } else if (!estimateObj.customerId && estimateObj.customerName) {
          customer = await db
            .insert(customers)
            .values({
              name: estimateObj.customerName,
              customerType: Role.CASH
            })
            .returning({ id: customers.id, name: customers.name, contact: customers.contact });
        }

        // --- CREATE ESTIMATE ---
        if (!estimateObj.billingId) {
          const result = db.transaction((tx) => {
            const estimate = tx
              .insert(estimates)
              .values({
                estimateNo: Number(estimateObj.estimateNo),
                customerId: customer[0].id,
                customerName: customer[0].name,
                customerContact: customer[0].contact,
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                createdAt: estimateObj.createdAt
                  ? removeTandZ(estimateObj.createdAt)
                  : sql`(datetime('now'))`
              })
              .returning({ id: estimates.id })
              .get();

            if (!estimate || !estimate.id) {
              throw new Error("Failed to Create Estimate");
            }

            for (const item of estimateObj.items) {
              if (!item.name) {
                throw new Error("Item name field cannot be empty");
              }

              tx.insert(estimateItems)
                .values({
                  estimateId: estimate.id,
                  productId: item.productId ? item.productId : null,
                  name: item.name,
                  mrp: item.mrp ? formatToPaisa(item.mrp) : null,
                  price: formatToPaisa(item.price),
                  purchasePrice: item.purchasePrice ? formatToPaisa(item.purchasePrice) : null,
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                })
                .run();
            }
            return {
              id: estimate.id,
              message: "Estimate was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.ESTIMATES },
            message: result.message
          };
        }
        // --- UPDATE ESTIMATE ---
        else {
          const result = db.transaction((tx) => {
            const estimate = tx
              .select()
              .from(estimates)
              .where(eq(estimates.id, estimateObj.billingId!))
              .get();

            if (!estimate || !estimate.id) {
              throw new Error("Estimate Not Found!");
            }

            tx.update(estimates)
              .set({
                customerId: estimateObj.customerId,
                customerName: estimateObj.customerName,
                customerContact: estimateObj.customerContact,
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                updatedAt: sql`(datetime('now'))`,
                createdAt: estimateObj.createdAt
                  ? removeTandZ(estimateObj.createdAt)
                  : sql`(datetime('now'))`
              })
              .where(eq(estimates.id, estimateObj.billingId!))
              .run();

            /**
             * @returns deletedItems = { changes: 5, lastInsertRowid: 0 }
             */
            const deletedItems = tx
              .delete(estimateItems)
              .where(eq(estimateItems.estimateId, estimate.id))
              .run();

            if (deletedItems.changes <= 0) {
              throw new Error("Something went wrong. Could not save estimate");
            }

            for (const item of estimateObj.items) {
              if (!item.name) {
                throw new Error("Item name field cannot be empty");
              }
              tx.insert(estimateItems)
                .values({
                  estimateId: estimate.id,
                  productId: item.productId ? item.productId : null,
                  name: item.name,
                  mrp: item.mrp ? formatToPaisa(item.mrp) : null,
                  price: formatToPaisa(item.price),
                  purchasePrice: item.purchasePrice ? formatToPaisa(item.purchasePrice) : null,
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: formatToPaisa(item.totalPrice),
                  updatedAt: sql`(datetime('now'))`
                })
                .run();
            }
            return {
              id: estimate.id,
              message: "Estimate was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.ESTIMATES },
            message: result.message
          };
        }
      } catch (error) {
        console.error("Error in estimatesApi:save transaction:", error);

        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "An error occurred while saving the estimate."
          }
        };
      }
    }
  );
}
