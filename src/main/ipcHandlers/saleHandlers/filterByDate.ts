import { and, asc, desc, gte, lte, SQL } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  SortOption,
  type DateRangeType,
  type PageNo,
  type PaginatedApiResponse,
  type SalesType,
  type SortType
} from "../../../shared/types";
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
    async (
      _event,
      range: DateRangeType,
      sortBy: SortType,
      pageNo: PageNo
    ): Promise<PaginatedApiResponse<SalesType[] | []>> => {
      if (pageNo === null || pageNo === undefined) {
        return {
          status: "success",
          nextPageNo: null,
          data: []
        };
      }

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

      let orderByClause: SQL;

      switch (sortBy) {
        case SortOption.DATE_NEWEST_FIRST:
          orderByClause = desc(sales.createdAt);
          break;
        case SortOption.DATE_OLDEST_FIRST:
          orderByClause = asc(sales.createdAt);
          break;
        case SortOption.HIGH_TO_LOW:
          orderByClause = desc(sales.grandTotal);
          break;
        case SortOption.LOW_TO_HIGH:
          orderByClause = asc(sales.grandTotal);
          break;

        default:
          orderByClause = desc(sales.createdAt);
          break;
      }

      try {
        const fromDate = range.from?.toISOString();
        const toDate = range.to?.toISOString();

        const offset = (pageNo - 1) * 20;

        const result = await db.query.sales.findMany({
          where: and(gte(sales.createdAt, fromDate), lte(sales.createdAt, toDate)),
          with: {
            customer: true,
            saleItems: true
          },
          orderBy: orderByClause,
          limit: 20,
          offset: offset
        });

        const nextpageNo = result.length === 20 ? pageNo + 1 : null;

        return {
          status: "success",
          nextPageNo: nextpageNo,
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
          error: { message: (error as Error).message ?? "An error occurred while filtering sales." }
        };
      }
    }
  );
}
