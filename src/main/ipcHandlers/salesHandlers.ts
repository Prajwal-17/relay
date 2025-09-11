import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type {
  ApiResponse,
  DateRangeType,
  SaleItemsType,
  SalePayload,
  SalesType
} from "../../shared/types";
import { removeTandZ } from "../../shared/utils/dateUtils";
import { formatToPaisa, formatToRupees } from "../../shared/utils/utils";
import { db } from "../db/db";
import { Role } from "../db/enum";
import { customers, estimateItems, estimates, saleItems, sales } from "../db/schema";

export function salesHandlers() {
  // get next invoice no
  ipcMain.handle("salesApi:getNextInvoiceNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastInvoice = await db.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1);
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

  // get all sales
  ipcMain.handle("salesApi:getAllSales", async (): Promise<ApiResponse<SalesType[]>> => {
    try {
      const salesArray = await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(40);

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

  //get sale by id
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

  // save & update
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
                customerName: customer[0].name,
                customerContact: customer[0].contact,
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
            return "Sale was saved successfully";
          });
          return { status: "success", data: result };
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
                customerName: saleObj.customerName,
                customerContact: saleObj.customerContact,
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
            return "Sale was updated successfully";
          });
          return { status: "success", data: result };
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

  /**
   * always convert date to ISOstring format for querying
   * IN Browser console -> the date is displayed as 28 Aug 2025 to 30 Aug 2025
   * But in ISO format it is -> { from: 2025-08-27T18:30:00.000Z, to: 2025-08-29T18:30:00.000Z }
   */
  // get sales by filtering date range
  ipcMain.handle(
    "salesApi:getSalesDateRange",
    async (_event, range: DateRangeType): Promise<ApiResponse<SalesType[] | []>> => {
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
          tempToDate.setDate(tempToDate.getDate() + 1);
          toDate = tempToDate.toISOString();
        }

        let result: SalesType[] | [];
        if (fromDate && toDate) {
          result = await db
            .select()
            .from(sales)
            .where(and(gte(sales.createdAt, fromDate), lt(sales.createdAt, toDate)))
            .orderBy(desc(sales.createdAt));
          // .limit(10);
        } else if (fromDate) {
          result = await db
            .select()
            .from(sales)
            .where(gte(sales.createdAt, fromDate))
            .orderBy(desc(sales.createdAt));
        } else if (toDate) {
          result = await db
            .select()
            .from(sales)
            .where(lt(sales.createdAt, toDate))
            .orderBy(desc(sales.createdAt));
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

  // delete a sale
  ipcMain.handle("salesApi:deleteSale", async (_event, saleId): Promise<ApiResponse<string>> => {
    try {
      if (!saleId) {
        return {
          status: "error",
          error: {
            message: "Sales does not exist"
          }
        };
      }

      const result = await db.delete(sales).where(eq(sales.id, saleId));

      if (result.changes > 0) {
        return { status: "success", data: "Sale delted successfull" };
      }

      return {
        status: "error",
        error: {
          message: "Sale not found.Could be already deleted"
        }
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        error: {
          message: "Something went wrong in sales api"
        }
      };
    }
  });

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
              customerName: saleObj.customerName,
              customerContact: saleObj.customerContact,
              grandTotal: saleObj.grandTotal,
              totalQuantity: saleObj.totalQuantity,
              isPaid: saleObj.isPaid
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
