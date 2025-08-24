import { desc, eq, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, SaleItemsType, SalePayload, SalesType } from "../../shared/types";
import { formatToPaisa } from "../../shared/utils";
import { db } from "../db/db";
import { saleItems, sales } from "../db/schema";

export function salesHandlers() {
  ipcMain.handle("salesApi:getNextInvoiceNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastInvoice = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(1);
      const lastInvoiceNo = lastInvoice[0]?.invoiceNo;
      let nextInvoiceNo = 1;

      if (lastInvoiceNo) {
        nextInvoiceNo = lastInvoiceNo + 1;
      }

      return { status: "success", data: nextInvoiceNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next invoice number" } };
    }
  });

  ipcMain.handle("salesApi:getAllSales", async (): Promise<ApiResponse<SalesType[]>> => {
    try {
      const salesArray = await db.select().from(sales).orderBy(desc(sales.createdAt));

      return { status: "success", data: salesArray };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve sales" } };
    }
  });

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
            items: saleItemsList
          }
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Failed to retrieve sales" } };
      }
    }
  );

  ipcMain.handle(
    "salesApi:save",
    async (_event, saleObj: SalePayload): Promise<ApiResponse<string>> => {
      try {
        // --- CREATE SALE ---
        if (!saleObj.billingId) {
          const result = db.transaction((tx) => {
            const sale = tx
              .insert(sales)
              .values({
                invoiceNo: Number(saleObj.invoiceNo),
                customerName: "DEFAULT",
                grandTotal: saleObj.grandTotal,
                totalQuantity: saleObj.totalQuantity,
                isPaid: true
              })
              .returning({ id: sales.id })
              .get();

            if (!sale || !sale.id) {
              throw new Error("SaleCreationFailure");
            }

            for (const item of saleObj.items) {
              if (!item.name || !item.productId) {
                continue;
              }

              tx.insert(saleItems)
                .values({
                  saleId: sale.id,
                  productId: item.productId,
                  name: item.name,
                  mrp: item.mrp ? formatToPaisa(item.mrp) : null,
                  price: formatToPaisa(item.price),
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                })
                .run();
            }
            return "Sale was saved successfully";
          });
          return { status: "success", data: result };
        }
        // --- UPDATE SALE ---
        else {
          const result = db.transaction((tx) => {
            if (!saleObj.billingId) {
              throw new Error("MissingBillingId");
            }

            const sale = tx.select().from(sales).where(eq(sales.id, saleObj.billingId)).get();

            if (!sale) {
              throw new Error("NoSaleFound");
            }

            tx.update(sales)
              .set({
                customerName: saleObj.customerName,
                customerContact: saleObj.customerContact,
                grandTotal: saleObj.grandTotal,
                totalQuantity: saleObj.totalQuantity,
                isPaid: saleObj.isPaid,
                updatedAt: sql`(datetime('now'))`
              })
              .where(eq(sales.id, saleObj.billingId))
              .run();

            tx.delete(saleItems).where(eq(saleItems.saleId, sale.id)).run();

            for (const item of saleObj.items) {
              if (!item.name) {
                continue;
              }
              tx.insert(saleItems)
                .values({
                  saleId: sale.id,
                  productId: item.productId,
                  name: item.name,
                  mrp: item.mrp ? formatToPaisa(item.mrp) : null,
                  price: formatToPaisa(item.price),
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: item.totalPrice
                })
                .run();
            }
            return "Sale was updated successfully";
          });
          return { status: "success", data: result };
        }
      } catch (error) {
        console.error("Error in salesApi:save transaction:", error);

        if (error instanceof Error) {
          if (error.message === "SaleCreationFailure") {
            return {
              status: "error",
              error: { message: "Could not create the sale record in the database." }
            };
          }
          if (error.message === "MissingBillingId") {
            return { status: "error", error: { message: "Billing ID is missing for the update." } };
          }
          if (error.message === "NoSaleFound") {
            return {
              status: "error",
              error: { message: "The sale you are trying to update could not be found." }
            };
          }
        }

        return {
          status: "error",
          error: { message: "An error occurred while saving the sale." }
        };
      }
    }
  );
}
