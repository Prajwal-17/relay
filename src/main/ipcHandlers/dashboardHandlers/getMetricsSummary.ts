import { and, eq, gte, lte, sql } from "drizzle-orm";
import { ipcMain } from "electron";
import { TREND_OPTION, type ApiResponse, type MetricsSummary } from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { customers, estimates, products, sales } from "../../db/schema";

export function getMetricsSummary() {
  ipcMain.handle(
    "dashboardApi:getMetricsSummary",
    async (): Promise<ApiResponse<MetricsSummary>> => {
      try {
        const today = new Date();
        const yesterday = new Date(today);
        today.setHours(0, 0, 0, 0);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const startofToday = today.toISOString();
        const endofToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        const startofYesterday = yesterday.toISOString();
        const endofYesterday = new Date(
          yesterday.getTime() + 24 * 60 * 60 * 1000 - 1
        ).toISOString();

        const result = db.transaction((tx) => {
          const productCount = tx
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(eq(products.isDeleted, false), eq(products.isDisabled, false)))
            .get();

          const customerCount = tx
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .get();

          const saleCount = tx
            .select({ count: sql<number>`count(*)` })
            .from(sales)
            .get();

          const estimateCount = tx
            .select({ count: sql<number>`count(*)` })
            .from(estimates)
            .get();

          const todaySaleRevenue = tx
            .select({ saleRevenue: sql<number>`sum(${sales.grandTotal})` })
            .from(sales)
            .where(and(gte(sales.createdAt, startofToday), lte(sales.createdAt, endofToday)))
            .get();

          const yesterdaySaleRevenue = tx
            .select({ saleRevenue: sql<number>`sum(${sales.grandTotal})` })
            .from(sales)
            .where(
              and(gte(sales.createdAt, startofYesterday), lte(sales.createdAt, endofYesterday))
            )
            .get();

          const todayEstimateRevenue = tx
            .select({ estimateRevenue: sql<number>`sum(${estimates.grandTotal})` })
            .from(estimates)
            .where(
              and(gte(estimates.createdAt, startofToday), lte(estimates.createdAt, endofToday))
            )
            .get();

          const yesterdayEstimateRevenue = tx
            .select({ estimateRevenue: sql<number>`sum(${estimates.grandTotal})` })
            .from(estimates)
            .where(
              and(
                gte(estimates.createdAt, startofYesterday),
                lte(estimates.createdAt, endofYesterday)
              )
            )
            .get();

          return {
            customerCount: customerCount?.count ?? 0,
            productCount: productCount?.count ?? 0,
            saleCount: saleCount?.count ?? 0,
            estimateCount: estimateCount?.count ?? 0,
            todaySaleRevenue: todaySaleRevenue?.saleRevenue ?? 0,
            yesterdaySaleRevenue: yesterdaySaleRevenue?.saleRevenue ?? 0,
            todayEstimateRevenue: todayEstimateRevenue?.estimateRevenue ?? 0,
            yesterdayEstimateRevenue: yesterdayEstimateRevenue?.estimateRevenue ?? 0
          };
        });

        const saleChangePercent = result.yesterdaySaleRevenue
          ? ((result.todaySaleRevenue - result.yesterdaySaleRevenue) /
              result.yesterdaySaleRevenue || 1) * 100
          : 0;

        const estimateChangePercent = result.yesterdayEstimateRevenue
          ? ((result.todayEstimateRevenue - result.yesterdayEstimateRevenue) /
              result.yesterdayEstimateRevenue || 1) * 100
          : 0;

        const saleTrend =
          saleChangePercent > 0
            ? TREND_OPTION.INCREASE
            : saleChangePercent < 0
              ? TREND_OPTION.DECREASE
              : TREND_OPTION.NO_CHANGE;

        const estimateTrend =
          estimateChangePercent > 0
            ? TREND_OPTION.INCREASE
            : estimateChangePercent < 0
              ? TREND_OPTION.DECREASE
              : TREND_OPTION.NO_CHANGE;

        const responseData = {
          counts: {
            customers: result.customerCount,
            products: result.productCount,
            sales: result.saleCount,
            estimates: result.estimateCount
          },
          sales: {
            today: formatToRupees(result.todaySaleRevenue),
            yesterday: formatToRupees(result.yesterdaySaleRevenue),
            changePercent: Number(saleChangePercent.toFixed(2)),
            trend: saleTrend
          },
          estimates: {
            today: formatToRupees(result.todayEstimateRevenue),
            yesterday: formatToRupees(result.yesterdayEstimateRevenue),
            changePercent: Number(estimateChangePercent.toFixed(2)),
            trend: estimateTrend
          }
        };

        return {
          status: "success",
          data: responseData
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Something went in dashboard api"
          }
        };
      }
    }
  );
}
