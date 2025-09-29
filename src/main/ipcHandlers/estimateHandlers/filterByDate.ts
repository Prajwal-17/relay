import { and, asc, desc, gte, lte, SQL } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  SortOption,
  type ApiResponse,
  type DateRangeType,
  type EstimateType,
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
      sortBy: SortType
    ): Promise<ApiResponse<EstimateType[] | []>> => {
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
        const fromDate = range.from?.toISOString();
        const toDate = range.to?.toISOString();
        const result = await db.query.estimates.findMany({
          where: and(gte(estimates.createdAt, fromDate), lte(estimates.createdAt, toDate)),
          with: {
            customer: true,
            estimateItems: true
          },
          orderBy: orderByClause
          // .limit(10);
        });

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
}
