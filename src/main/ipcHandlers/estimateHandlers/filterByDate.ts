import { and, asc, count, desc, gte, lte, SQL, sum } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  SortOption,
  type DateRangeType,
  type EstimateSummaryType,
  type PageNo,
  type PaginatedApiResponse,
  type SortType
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function filterByDate() {
  // get estimates by filtering date range
  ipcMain.handle(
    "estimatesApi:getEstimatesDateRange",
    async (
      _event,
      range: DateRangeType,
      sortBy: SortType,
      pageNo: PageNo
    ): Promise<PaginatedApiResponse<EstimateSummaryType>> => {
      if (pageNo === null || pageNo === undefined) {
        return {
          status: "success",
          nextPageNo: null,
          data: {
            totalRevenue: 0,
            totalTransactions: 0,
            estimates: []
          }
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
          orderByClause = desc(estimates.createdAt);
          break;
        case SortOption.DATE_OLDEST_FIRST:
          orderByClause = asc(estimates.createdAt);
          break;
        case SortOption.HIGH_TO_LOW:
          orderByClause = desc(estimates.grandTotal);
          break;
        case SortOption.LOW_TO_HIGH:
          orderByClause = asc(estimates.grandTotal);
          break;

        default:
          orderByClause = desc(estimates.createdAt);
          break;
      }

      try {
        const fromDate = range.from.toISOString();
        const toDate = range.to.toISOString();

        const offset = (pageNo - 1) * 20;

        const summaryResult = await db
          .select({
            totalRevenue: sum(estimates.grandTotal).mapWith(Number),
            totalTransactions: count(estimates.id).mapWith(Number)
          })
          .from(estimates)
          .where(and(gte(estimates.createdAt, fromDate), lte(estimates.createdAt, toDate)))
          .orderBy(orderByClause);

        const result = await db.query.estimates.findMany({
          where: and(gte(estimates.createdAt, fromDate), lte(estimates.createdAt, toDate)),
          with: {
            customer: true,
            estimateItems: true
          },
          orderBy: orderByClause,
          limit: 20,
          offset: offset
        });

        const nextpageNo = result.length === 20 ? pageNo + 1 : null;

        return {
          status: "success",
          nextPageNo: nextpageNo,
          data: {
            totalRevenue: formatToRupees(summaryResult[0].totalRevenue),
            totalTransactions: summaryResult[0].totalTransactions,
            estimates:
              result.length > 0
                ? result.map((r) => ({
                    ...r,
                    customerName: r.customer.name,
                    grandTotal: r.grandTotal && formatToRupees(r.grandTotal)
                  }))
                : []
          }
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "An error occurred while filtering estimates."
          }
        };
      }
    }
  );
}
