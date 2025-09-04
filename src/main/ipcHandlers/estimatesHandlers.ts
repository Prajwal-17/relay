import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type {
  ApiResponse,
  DateRangeType,
  EstimateItemsType,
  EstimatePayload,
  EstimateType
} from "../../shared/types";
import { formatToPaisa, formatToRupees, removeTandZ } from "../../shared/utils";
import { db } from "../db/db";
import { customers, estimateItems, estimates, saleItems, sales } from "../db/schema";

export function estimatesHandlers() {
  ipcMain.handle("estimatesApi:getNextEstimateNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastEstimate = await db
        .select()
        .from(estimates)
        .orderBy(desc(estimates.estimateNo))
        .limit(1);
      const lastEstimateNo = lastEstimate[0]?.estimateNo;
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

      return {
        status: "success",
        data: estimatesArray.map((estimate: EstimateType) => {
          return {
            ...estimate,
            grandTotal: estimate.grandTotal && formatToRupees(estimate.grandTotal)
          };
        })
      };
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
            items: estimateItemsList.map((item) => {
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
        return { status: "error", error: { message: "Failed to retrieve estimate" } };
      }
    }
  );

  ipcMain.handle(
    "estimatesApi:save",
    async (_event, estimateObj: EstimatePayload): Promise<ApiResponse<string>> => {
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
              customerType: "cash"
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
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: true,
                createdAt: estimateObj.createdAt
                  ? removeTandZ(estimateObj.createdAt)
                  : sql`(datetime('now'))`
              })
              .returning({ id: estimates.id })
              .get();

            if (!estimate || !estimate.id) {
              throw new Error("EstimateCreationFailure");
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
                customerId: estimateObj.customerId,
                customerName: estimateObj.customerName,
                customerContact: estimateObj.customerContact,
                grandTotal: formatToPaisa(estimateObj.grandTotal),
                totalQuantity: estimateObj.totalQuantity,
                isPaid: estimateObj.isPaid,
                updatedAt: sql`(datetime('now'))`
              })
              .where(eq(estimates.id, estimateObj.billingId))
              .run();

            tx.delete(estimateItems).where(eq(estimateItems.estimateId, estimate.id)).run();

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
          error: {
            message: (error as Error).message ?? "An error occurred while saving the estimate."
          }
        };
      }
    }
  );

  // get estimates by filtering date range
  ipcMain.handle(
    "estimatesApi:getEstimatesDateRange",
    async (_event, range: DateRangeType): Promise<ApiResponse<EstimateType[] | []>> => {
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

        let result: EstimateType[] | [];
        if (fromDate && toDate) {
          console.log("both ", fromDate, toDate);
          result = await db
            .select()
            .from(estimates)
            .where(and(gte(estimates.createdAt, fromDate), lt(estimates.createdAt, toDate)))
            .orderBy(desc(estimates.createdAt));
          // .limit(10);
        } else if (fromDate) {
          console.log("from date", fromDate);
          result = await db
            .select()
            .from(estimates)
            .where(gte(estimates.createdAt, fromDate))
            .orderBy(desc(estimates.createdAt));
        } else if (toDate) {
          console.log("todate", toDate);
          result = await db
            .select()
            .from(estimates)
            .where(lt(estimates.createdAt, toDate))
            .orderBy(desc(estimates.createdAt));
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
              ? result.map((estimate: EstimateType) => ({
                  ...estimate,
                  grandTotal: estimate.grandTotal && formatToRupees(estimate.grandTotal)
                }))
              : []
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "An error occurred while filtering estimates." }
        };
      }
    }
  );

  // delete a estimate
  ipcMain.handle(
    "estimatesApi:deleteEstimate",
    async (_event, estimateId): Promise<ApiResponse<string>> => {
      try {
        if (!estimateId) {
          return {
            status: "error",
            error: {
              message: "Estimates does not exist"
            }
          };
        }

        const result = await db.delete(estimates).where(eq(estimates.id, estimateId));

        if (result.changes > 0) {
          return { status: "success", data: "Estimate deleted successfully" };
        }

        return {
          status: "error",
          error: {
            message: "Estimate not found.Could be already deleted"
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: "Something went wrong in estimates api"
          }
        };
      }
    }
  );

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
              customerName: estimateObj.customerName,
              customerContact: estimateObj.customerContact,
              grandTotal: estimateObj.grandTotal,
              totalQuantity: estimateObj.totalQuantity,
              isPaid: estimateObj.isPaid
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
