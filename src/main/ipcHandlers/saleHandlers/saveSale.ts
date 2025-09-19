import { eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type SalePayload,
  type TransactionType
} from "../../../shared/types";
import { removeTandZ } from "../../../shared/utils/dateUtils";
import { formatToPaisa } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { Role } from "../../db/enum";
import { customers, saleItems, sales } from "../../db/schema";

export function saveSale() {
  // save & update
  ipcMain.handle(
    "salesApi:save",
    async (
      _event,
      saleObj: SalePayload
    ): Promise<ApiResponse<{ id: string; type: TransactionType }>> => {
      try {
        let customer;
        if (!saleObj.customerName) {
          customer = await db.select().from(customers).where(eq(customers.name, "DEFAULT"));
        } else if (saleObj.customerId && saleObj.customerName) {
          customer = await db.select().from(customers).where(eq(customers.id, saleObj.customerId));
        } else if (!saleObj.customerId && saleObj.customerName) {
          customer = await db
            .insert(customers)
            .values({
              name: saleObj.customerName,
              customerType: Role.CASH
            })
            .returning({ id: customers.id, name: customers.name, contact: customers.contact });
        }

        // --- CREATE SALE ---
        if (!saleObj.billingId) {
          const result = db.transaction((tx) => {
            const sale = tx
              .insert(sales)
              .values({
                invoiceNo: Number(saleObj.invoiceNo),
                customerId: customer[0].id,
                grandTotal: formatToPaisa(saleObj.grandTotal),
                totalQuantity: saleObj.totalQuantity,
                isPaid: saleObj.isPaid,
                createdAt: saleObj.createdAt
                  ? removeTandZ(saleObj.createdAt)
                  : sql`(datetime('now'))`
              })
              .returning({ id: sales.id })
              .get();

            if (!sale || !sale.id) {
              throw new Error("Failed to Create Sale");
            }

            for (const item of saleObj.items) {
              if (!item.name) {
                throw new Error("Item name field cannot be empty");
              }

              tx.insert(saleItems)
                .values({
                  saleId: sale.id,
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
              id: sale.id,
              message: "Sale was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.SALES },
            message: result.message
          };
        }
        // --- UPDATE SALE ---
        else {
          const result = db.transaction((tx) => {
            const sale = tx.select().from(sales).where(eq(sales.id, saleObj.billingId!)).get();

            if (!sale || !sale.id) {
              throw new Error("Sale not found!");
            }

            tx.update(sales)
              .set({
                customerId: saleObj.customerId,
                grandTotal: formatToPaisa(saleObj.grandTotal),
                totalQuantity: saleObj.totalQuantity,
                isPaid: saleObj.isPaid,
                updatedAt: sql`(datetime('now'))`,
                createdAt: saleObj.createdAt
                  ? removeTandZ(saleObj.createdAt)
                  : sql`(datetime('now'))`
              })
              .where(eq(sales.id, saleObj.billingId!))
              .run();

            /**
             * @returns deletedItems = { changes: number, lastInsertRowid: number }
             */
            const deletedItems = tx.delete(saleItems).where(eq(saleItems.saleId, sale.id)).run();

            if (deletedItems.changes <= 0) {
              throw new Error("Something went wrong. Could not save sale");
            }

            for (const item of saleObj.items) {
              if (!item.name) {
                throw new Error("Item name field cannot be empty");
              }
              tx.insert(saleItems)
                .values({
                  saleId: sale.id,
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
              id: sale.id,
              message: "Sale was saved successfully"
            };
          });
          return {
            status: "success",
            data: { id: result.id, type: TRANSACTION_TYPE.SALES },
            message: result.message
          };
        }
      } catch (error) {
        console.error("Error in salesApi:save transaction:", error);

        return {
          status: "error",
          error: { message: (error as Error).message ?? "An error occurred while saving the sale." }
        };
      }
    }
  );
}
