import { and, desc, gte, lt } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, DateRangeType, SalesType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function filterByDate() {
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
          result = await db.query.sales.findMany({
            where: and(gte(sales.createdAt, fromDate), lt(sales.createdAt, toDate)),
            with: {
              customer: true,
              saleItems: true
            },
            orderBy: desc(sales.createdAt)
            // .limit(10);
          });
        } else if (fromDate) {
          result = await db.query.sales.findMany({
            where: gte(sales.createdAt, fromDate),
            with: {
              customer: true,
              saleItems: true
            },
            orderBy: desc(sales.createdAt)
          });
        } else if (toDate) {
          result = await db.query.sales.findMany({
            where: lt(sales.createdAt, toDate),
            with: {
              customer: true,
              saleItems: true
            },
            orderBy: desc(sales.createdAt)
          });
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
