import {
  TIME_PERIOD,
  TRANSACTION_TYPE,
  TREND_OPTION,
  type ChartDataType,
  type MetricsSummary,
  type RecentTransactions,
  type TimePeriodType,
  type TopProductDataPoint,
  type TransactionType
} from "../../../shared/types";
import { convertToRupees } from "../../../shared/utils/utils";
import { dashboardRepository } from "./dashboard.repository";
import {
  dayNames,
  getDashboardDates,
  getLast7DaysRange,
  getThisWeekRange,
  monthNames
} from "./dashboard.utils";

const getMetricsSummary = async (): Promise<MetricsSummary> => {
  const dates = getDashboardDates();
  const result = await dashboardRepository.getDashboardMetrics(dates);

  const saleChangePercent = result.yesterdaySaleRevenue
    ? ((result.todaySaleRevenue - result.yesterdaySaleRevenue) / result.yesterdaySaleRevenue || 1) *
      100
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

  return {
    counts: {
      customers: result.customerCount,
      products: result.productCount,
      sales: result.saleCount,
      estimates: result.estimateCount
    },
    sales: {
      today: result.todaySaleRevenue,
      yesterday: result.yesterdaySaleRevenue,
      changePercent: Number(saleChangePercent.toFixed(2)),
      trend: saleTrend
    },
    estimates: {
      today: result.todayEstimateRevenue,
      yesterday: result.yesterdayEstimateRevenue,
      changePercent: Number(estimateChangePercent.toFixed(2)),
      trend: estimateTrend
    }
  };
};

const getTopProducts = async (): Promise<TopProductDataPoint[]> => {
  const result = await dashboardRepository.getTopProducts(5);

  const sum = result.reduce((acc, curr) => {
    if (!curr.totalQuantitySold) return acc;
    return curr.totalQuantitySold + acc;
  }, 0);

  return result.map((r) => ({
    id: r.id,
    name: r.name,
    totalQuantitySold: r.totalQuantitySold ? r.totalQuantitySold : 0,
    sharePercent: r.totalQuantitySold ? Number(((r.totalQuantitySold / sum) * 100).toFixed(2)) : 0
  }));
};

const getRecentTransactions = async (type: TransactionType): Promise<RecentTransactions | []> => {
  if (type === TRANSACTION_TYPE.SALE) {
    const result = await dashboardRepository.getRecentSales(5);

    return result.length > 0
      ? result.map((r) => ({
          ...r,
          transactionNo: r.invoiceNo,
          customerName: r.customer.name,
          grandTotal: r.grandTotal
        }))
      : [];
  } else if (type === TRANSACTION_TYPE.ESTIMATE) {
    const result = await dashboardRepository.getRecentEstimates(5);

    return result.length > 0
      ? result.map((r) => ({
          ...r,
          transactionNo: r.estimateNo,
          customerName: r.customer.name,
          grandTotal: r.grandTotal
        }))
      : [];
  }
  return [];
};

const getSalesEstimatesRevenueByThisWeek = async (): Promise<ChartDataType[]> => {
  const { startDate, endDate } = getThisWeekRange();

  const { saleResults, estimateResults } = await dashboardRepository.getDailyRevenue(
    startDate,
    endDate
  );

  const chartData: ChartDataType[] = [];

  for (let i = 0; i < saleResults.length; i++) {
    const sale = saleResults[i];
    const estimate = estimateResults.find((e) => e.date === sale.date);

    const dayIndex = Number(sale.day);
    const formattedDate = `${Number(sale.date)}-${dayNames[dayIndex]}`;

    chartData.push({
      label: formattedDate,
      sales: convertToRupees(sale.total) ?? 0,
      estimates: convertToRupees(estimate?.total as number) ?? 0
    });
  }

  return chartData;
};

const getSalesEstimatesRevenueByMonth = async (): Promise<ChartDataType[]> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const { saleResults, estimateResults } = await dashboardRepository.getMonthlyRevenue(currentYear);

  const salesMap = Object.fromEntries(saleResults.map((row) => [parseInt(row.month), row.total]));

  const estimatesMap = Object.fromEntries(
    estimateResults.map((row) => [parseInt(row.month), row.total])
  );

  const chartData = monthNames.slice(0, currentMonth + 1).map((month, index) => {
    const monthIndex = index + 1;
    return {
      label: month,
      sales: convertToRupees(salesMap[monthIndex]) || 0,
      estimates: convertToRupees(estimatesMap[monthIndex]) || 0
    };
  });

  return chartData;
};

const getSalesEstimatesRevenueByLast7Days = async (): Promise<ChartDataType[]> => {
  const { startDate, endDate } = getLast7DaysRange();

  const { saleResults, estimateResults } = await dashboardRepository.getDailyRevenue(
    startDate,
    endDate
  );

  const chartData: ChartDataType[] = [];

  for (let i = 0; i < saleResults.length; i++) {
    const sale = saleResults[i];
    const estimate = estimateResults.find((e) => e.date === sale.date);

    const dayIndex = Number(sale.day);
    const formattedDate = `${Number(sale.date)}-${dayNames[dayIndex]}`;

    chartData.push({
      label: formattedDate,
      sales: convertToRupees(sale.total) ?? 0,
      estimates: convertToRupees(estimate?.total as number) ?? 0
    });
  }

  return chartData;
};

const getChartMetrics = async (timePeriod: TimePeriodType): Promise<ChartDataType[]> => {
  let data: ChartDataType[] = [];

  if (timePeriod === TIME_PERIOD.THIS_YEAR) {
    data = await getSalesEstimatesRevenueByMonth();
  } else if (timePeriod === TIME_PERIOD.LAST_7_DAYS) {
    data = await getSalesEstimatesRevenueByLast7Days();
  } else if (timePeriod === TIME_PERIOD.THIS_WEEK) {
    data = await getSalesEstimatesRevenueByThisWeek();
  }

  return data;
};

export const dashboardService = {
  getMetricsSummary,
  getTopProducts,
  getRecentTransactions,
  getChartMetrics
};
