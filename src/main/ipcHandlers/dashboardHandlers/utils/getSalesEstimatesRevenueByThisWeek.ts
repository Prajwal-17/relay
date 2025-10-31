import { and, gte, lte, sql } from "drizzle-orm";
import type { ChartDataType } from "../../../../shared/types";
import { formatToRupees } from "../../../../shared/utils/utils";
import { db } from "../../../db/db";
import { estimates, sales } from "../../../db/schema";

export const getSalesEstimatesRevenueByThisWeek = async (): Promise<ChartDataType[]> => {
  try {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const now = new Date();

    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const [saleResults, estimateResults] = await Promise.all([
      db
        .select({
          date: sql<string>`strftime('%d',${sales.createdAt})`,
          day: sql<string>`strftime('%w', ${sales.createdAt})`,
          total: sql<number>`SUM(${sales.grandTotal})`
        })
        .from(sales)
        .where(
          and(
            gte(sales.createdAt, startDate.toISOString()),
            lte(sales.createdAt, endDate.toISOString())
          )
        )
        .groupBy(sql`strftime('%d',${sales.createdAt})`)
        .all(),
      db
        .select({
          date: sql<string>`strftime('%d',${estimates.createdAt})`,
          day: sql<string>`strftime('%w', ${estimates.createdAt})`,
          total: sql<number>`SUM(${estimates.grandTotal})`
        })
        .from(estimates)
        .where(
          and(
            gte(estimates.createdAt, startDate.toISOString()),
            lte(estimates.createdAt, endDate.toISOString())
          )
        )
        .groupBy(sql`strftime('%d',${estimates.createdAt})`)
        .all()
    ]);

    const chartData: any = [];

    for (let i = 0; i < saleResults.length; i++) {
      const sale = saleResults[i];
      const estimate = estimateResults.find((e) => e.date === sale.date);

      const dayIndex = Number(sale.day);
      const formattedDate = `${Number(sale.date)}-${dayNames[dayIndex]}`;

      chartData.push({
        label: formattedDate,
        sales: formatToRupees(sale.total) ?? 0,
        estimates: formatToRupees(estimate?.total as number) ?? 0
      });
    }

    return chartData;
  } catch (error) {
    console.log(error);
    throw new Error(
      (error as Error).message ?? "Failed to retrieve sales and estimates data by month."
    );
  }
};
