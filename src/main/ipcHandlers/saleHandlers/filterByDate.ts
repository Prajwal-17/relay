import { and, asc, desc, eq, gt, gte, lte, or, SQL } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  SortOption,
  type DateRangeType,
  type NextCursor,
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
      cursor: NextCursor
    ): Promise<PaginatedApiResponse<SalesType[] | []>> => {
      console.log("cursor", cursor);
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

        const cursorWhereClause = cursor
          ? or(
              gt(sales.createdAt, cursor.createdAt),
              and(eq(sales.createdAt, cursor.createdAt), gt(sales.id, cursor.id))
            )
          : undefined;

        const result = await db.query.sales.findMany({
          where: and(
            gte(sales.createdAt, fromDate),
            lte(sales.createdAt, toDate),
            cursorWhereClause
          ),
          with: {
            customer: true,
            saleItems: true
          },
          orderBy: orderByClause,
          limit: 20
        });

        let nextCursor: NextCursor = null;
        if (result.length === 20) {
          const lastResult = result[result.length - 1];
          nextCursor = {
            id: lastResult.id,
            createdAt: lastResult.createdAt
          };
        }

        return {
          status: "success",
          nextCursor: nextCursor,
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
