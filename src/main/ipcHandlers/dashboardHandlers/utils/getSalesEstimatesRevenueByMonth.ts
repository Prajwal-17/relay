import { eq, sql } from "drizzle-orm";
import type { ChartDataType } from "../../../../shared/types";
import { formatToRupees } from "../../../../shared/utils/utils";
import { db } from "../../../db/db";
import { estimates, sales } from "../../../db/schema";

export const getSalesEstimatesRevenueByMonth = async (): Promise<ChartDataType[]> => {
  try {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const [saleResults, estimateResults] = await Promise.all([
      db
        .select({
          month: sql<string>`strftime('%m',${sales.createdAt})`,
          total: sql<number>`SUM(${sales.grandTotal})`
        })
        .from(sales)
        .where(eq(sql`strftime('%Y',${sales.createdAt})`, `${currentYear}`))
        .groupBy(sql`strftime('%m',${sales.createdAt})`)
        .all(),

      db
        .select({
          month: sql<string>`strftime('%m',${estimates.createdAt})`,
          total: sql<number>`SUM(${estimates.grandTotal})`
        })
        .from(estimates)
        .where(eq(sql`strftime('%Y',${estimates.createdAt})`, `${currentYear}`))
        .groupBy(sql`strftime('%m',${estimates.createdAt})`)
        .all()
    ]);

    const salesMap = Object.fromEntries(saleResults.map((row) => [parseInt(row.month), row.total]));

    const estimatesMap = Object.fromEntries(
      estimateResults.map((row) => [parseInt(row.month), row.total])
    );

    const chartData = monthNames.slice(0, currentMonth + 1).map((month, index) => {
      const monthIndex = index + 1;
      return {
        label: month,
        sales: formatToRupees(salesMap[monthIndex]) || 0,
        estimates: formatToRupees(estimatesMap[monthIndex]) || 0
      };
    });

    return chartData;
  } catch (error) {
    console.log(error);
    throw new Error(
      (error as Error).message ?? "Failed to retrieve sales and estimates data by month."
    );
  }
};
