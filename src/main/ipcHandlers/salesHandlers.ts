import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type {
  ApiResponse,
  DateRangeType,
  SaleItemsType,
  SalePayload,
  SalesType
} from "../../shared/types";
import { formatToPaisa, formatToRupees } from "../../shared/utils";
import { db } from "../db/db";
import { customers, saleItems, sales } from "../db/schema";

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

      return {
        status: "success",
        data: salesArray.map((sale: SalesType) => {
          return {
            ...sale,
            grandTotal: sale.grandTotal && formatToRupees(sale.grandTotal)
          };
        })
      };
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

  ipcMain.handle(
    "salesApi:save",
    async (_event, saleObj: SalePayload): Promise<ApiResponse<string>> => {
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
              customerType: "cash"
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
                customerName: customer[0].name,
                grandTotal: formatToPaisa(saleObj.grandTotal),
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
                  productId: item.productId ? item.productId : null,
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
                customerId: saleObj.customerId,
                customerName: saleObj.customerName,
                customerContact: saleObj.customerContact,
                grandTotal: formatToPaisa(saleObj.grandTotal),
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
                  productId: item.productId ? item.productId : null,
                  name: item.name,
                  mrp: item.mrp ? formatToPaisa(item.mrp) : null,
                  price: formatToPaisa(item.price),
                  weight: item.weight,
                  unit: item.unit,
                  quantity: item.quantity,
                  totalPrice: formatToPaisa(item.totalPrice)
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

  /**
   * always convert date to ISOstring format for querying
   * IN Browser console -> the date is displayed as 28 Aug 2025 to 30 Aug 2025
   * But in ISO format it is -> { from: 2025-08-27T18:30:00.000Z, to: 2025-08-29T18:30:00.000Z }
   */
  ipcMain.handle(
    "salesApi:getSalesDateRange",
    async (_event, range: DateRangeType): Promise<ApiResponse<SalesType[] | []>> => {
      console.log(range);
      if (!range.from && !range.to) {
        return {
          status: "error",
          error: {
            message: "Invalid date range provided."
          }
        };
      }

      if (range.from === undefined && range.to === undefined) {
        return {
          status: "error",
          error: {
            message: "Invalid Dates"
          }
        };
      }

      try {
        const fromDate = range.from?.toISOString();
        let toDate;
        if (range.to !== undefined) {
          const tempToDate = new Date(range.to);
          console.log(tempToDate);
          tempToDate.setDate(tempToDate.getDate() + 1);
          console.log(tempToDate);
          toDate = tempToDate.toISOString();
        }

        let result: SalesType[] | [];
        if (fromDate && toDate) {
          result = await db
            .select()
            .from(sales)
            .where(and(gte(sales.createdAt, fromDate), lt(sales.createdAt, toDate)));
          // .limit(10);
        } else if (fromDate) {
          result = await db.select().from(sales).where(gte(sales.createdAt, fromDate));
        } else if (toDate) {
          result = await db.select().from(sales).where(lt(sales.createdAt, toDate));
        } else {
          return {
            status: "error",
            error: {
              message: "Provide Date Range"
            }
          };
        }

        return {
          status: "success",
          data:
            result.length > 0
              ? result.map((sale: SalesType) => ({
                  ...sale,
                  grandTotal: sale.grandTotal && formatToRupees(sale.grandTotal)
                }))
              : []
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "An error occurred while filtering sales." }
        };
      }
    }
  );
}
