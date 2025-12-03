import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type CustomersType,
  type EstimatePayload,
  type TransactionType
} from "../../../shared/types";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { CustomerRole } from "../../db/enum";
import { customers, estimateItems, estimates, products } from "../../db/schema";

export function saveEstimate() {
  ipcMain.handle(
    "estimatesApi:save",
    async (
      _event,
      estimateObj: EstimatePayload
    ): Promise<ApiResponse<{ id: string; type: TransactionType }>> => {
      try {
        let customer: CustomersType | undefined;
        if (!estimateObj.customerName || estimateObj.customerName.trim() === "") {
          const [defaultCustomer] = await db
            .select()
            .from(customers)
            .where(eq(customers.name, "DEFAULT"));
          customer = defaultCustomer;
        } else if (estimateObj.customerId && estimateObj.customerName) {
          const [defaultCustomer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, estimateObj.customerId));
          customer = defaultCustomer;
        } else if (!estimateObj.customerId && estimateObj.customerName) {
          const [existingCustomer] = await db
            .select()
            .from(customers)
            .where(eq(customers.name, estimateObj.customerName));

          if (existingCustomer) {
            customer = existingCustomer;
          } else {
            const [defaultCustomer] = await db
              .insert(customers)
              .values({
                name: estimateObj.customerName,
                customerType: CustomerRole.CASH
              })
              .returning({
                id: customers.id,
                name: customers.name,
                contact: customers.contact,
                customerType: customers.customerType
              });
            customer = defaultCustomer;
          }
        }

        if (!customer) {
          throw new Error("Something went wrong.Could not find customer.");
        }

        // --- CREATE ESTIMATE ---
        if (!estimateObj.billingId) {
          const result = db.transaction((tx) => {
            const estimate = tx
              .insert(estimates)
              .values({
                estimateNo: Number(estimateObj.estimateNo),
                customerId: customer.id,
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                createdAt: estimateObj.createdAt
                  ? estimateObj.createdAt
                  : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
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
                  totalPrice: formatToPaisa(item.totalPrice)
                })
                .run();

              if (products.id) {
                tx.update(products)
                  .set({
                    totalQuantitySold: sql`${products.totalQuantitySold} + ${item.quantity}`
                  })
                  .where(eq(products.id, item.productId))
                  .run();
              }
            }
            return {
              id: estimate.id,
              message: "Estimate was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.ESTIMATE },
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
                customerId: customer.id,
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
                createdAt: estimateObj.createdAt
                  ? estimateObj.createdAt
                  : sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
              })
              .where(eq(estimates.id, estimateObj.billingId!))
              .run();

            // get existing estimateItems of a estimate
            const allEstimateItems = tx
              .select()
              .from(estimateItems)
              .where(eq(estimateItems.estimateId, estimateObj.billingId!))
              .all();

            if (!allEstimateItems) {
              throw new Error("Estimate Items does not exist");
            }

            // revert quantity values
            for (const item of allEstimateItems) {
              if (item.productId) {
                tx.update(products)
                  .set({
                    totalQuantitySold: sql`${products.totalQuantitySold} - ${item.quantity}`
                  })
                  .where(eq(products.id, item.productId))
                  .run();
              }
            }

            /**
             * @returns deletedItems = { changes: 5, lastInsertRowid: 0 }
             * delete the current estimateItems and then insert the new estimateItems
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
              // insert new estimateItems
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
                  updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
                })
                .run();

              // update totalQuantitySold
              if (item.productId) {
                tx.update(products)
                  .set({
                    totalQuantitySold: sql`${products.totalQuantitySold} + ${item.quantity}`
                  })
                  .where(eq(products.id, item.productId))
                  .run();
              }
            }
            return {
              id: estimate.id,
              message: "Estimate was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.ESTIMATE },
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
