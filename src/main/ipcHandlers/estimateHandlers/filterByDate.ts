import { and, desc, gte, lt } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, DateRangeType, EstimateType } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";

export function filterByDate() {
  // get estimates by filtering date range
  ipcMain.handle(
    "estimatesApi:getEstimatesDateRange",
    async (_event, range: DateRangeType): Promise<ApiResponse<EstimateType[] | []>> => {
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

        let result: EstimateType[] | [];
        if (fromDate && toDate) {
          result = await db.query.estimates.findMany({
            where: and(gte(estimates.createdAt, fromDate), lt(estimates.createdAt, toDate)),
            with: {
              customer: true,
              estimateItems: true
            },
            orderBy: desc(estimates.createdAt)
            // .limit(10);
          });
        } else if (fromDate) {
          result = await db.query.estimates.findMany({
            where: gte(estimates.createdAt, fromDate),
            with: {
              customer: true,
              estimateItems: true
            },
            orderBy: desc(estimates.createdAt)
          });
        } else if (toDate) {
          result = await db.query.estimates.findMany({
            where: lt(estimates.createdAt, toDate),
            with: {
              customer: true,
              estimateItems: true
            },
            orderBy: desc(estimates.createdAt)
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
