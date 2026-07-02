import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { customers, estimates, products, sales } from "../../db/schema";
import type { DashboardDates } from "./dashboard.types";

const getDashboardMetrics = async (dates: DashboardDates) => {
  return db.transaction((tx) => {
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
      .where(and(gte(sales.createdAt, dates.startofToday), lte(sales.createdAt, dates.endofToday)))
      .get();

    const yesterdaySaleRevenue = tx
      .select({ saleRevenue: sql<number>`sum(${sales.grandTotal})` })
      .from(sales)
      .where(
        and(
          gte(sales.createdAt, dates.startofYesterday),
          lte(sales.createdAt, dates.endofYesterday)
        )
      )
      .get();

    const todayEstimateRevenue = tx
      .select({ estimateRevenue: sql<number>`sum(${estimates.grandTotal})` })
      .from(estimates)
      .where(
        and(
          gte(estimates.createdAt, dates.startofToday),
          lte(estimates.createdAt, dates.endofToday)
        )
      )
      .get();

    const yesterdayEstimateRevenue = tx
      .select({ estimateRevenue: sql<number>`sum(${estimates.grandTotal})` })
      .from(estimates)
      .where(
        and(
          gte(estimates.createdAt, dates.startofYesterday),
          lte(estimates.createdAt, dates.endofYesterday)
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
};

const getTopProducts = async (limit: number = 5) => {
  return db
    .select({
      id: products.id,
      name: products.name,
      totalQuantitySold: products.totalQuantitySold
    })
    .from(products)
    .orderBy(desc(products.totalQuantitySold))
    .limit(limit)
    .all();
};

const getRecentSales = async (limit: number = 5) => {
  return await db.query.sales.findMany({
    with: {
      customer: true
    },
    orderBy: desc(sales.createdAt),
    limit: limit
  });
};

const getRecentEstimates = async (limit: number = 5) => {
  return await db.query.estimates.findMany({
    with: {
      customer: true
    },
    orderBy: desc(estimates.createdAt),
    limit: limit
  });
};

const getDailyRevenue = async (startDate: string, endDate: string) => {
  return db.transaction((tx) => {
    const saleResults = tx
      .select({
        date: sql<string>`strftime('%d',${sales.createdAt})`,
        day: sql<string>`strftime('%w', ${sales.createdAt})`,
        total: sql<number>`SUM(${sales.grandTotal})`
      })
      .from(sales)
      .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
      .groupBy(sql`strftime('%d',${sales.createdAt})`)
      .all();

    const estimateResults = tx
      .select({
        date: sql<string>`strftime('%d',${estimates.createdAt})`,
        day: sql<string>`strftime('%w', ${estimates.createdAt})`,
        total: sql<number>`SUM(${estimates.grandTotal})`
      })
      .from(estimates)
      .where(and(gte(estimates.createdAt, startDate), lte(estimates.createdAt, endDate)))
      .groupBy(sql`strftime('%d',${estimates.createdAt})`)
      .all();

    return { saleResults, estimateResults };
  });
};

const getMonthlyRevenue = async (year: number) => {
  return db.transaction((tx) => {
    const saleResults = tx
      .select({
        month: sql<string>`strftime('%m',${sales.createdAt})`,
        total: sql<number>`SUM(${sales.grandTotal})`
      })
      .from(sales)
      .where(eq(sql`strftime('%Y',${sales.createdAt})`, `${year}`))
      .groupBy(sql`strftime('%m',${sales.createdAt})`)
      .all();

    const estimateResults = tx
      .select({
        month: sql<string>`strftime('%m',${estimates.createdAt})`,
        total: sql<number>`SUM(${estimates.grandTotal})`
      })
      .from(estimates)
      .where(eq(sql`strftime('%Y',${estimates.createdAt})`, `${year}`))
      .groupBy(sql`strftime('%m',${estimates.createdAt})`)
      .all();

    return { saleResults, estimateResults };
  });
};

export const dashboardRepository = {
  getDashboardMetrics,
  getTopProducts,
  getRecentSales,
  getRecentEstimates,
  getDailyRevenue,
  getMonthlyRevenue
};
