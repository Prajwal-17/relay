import {
  TIME_PERIOD,
  TRANSACTION_TYPE,
  TREND_OPTION,
  type ApiResponse,
  type ChartDataType,
  type Estimate,
  type MetricsSummary,
  type Sale,
  type TimePeriodType,
  type TopProductDataPoint,
  type TransactionType
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { dashboardRepository } from "./dashboard.repository";
import {
  dayNames,
  getDashboardDates,
  getLast7DaysRange,
  getThisWeekRange,
  monthNames
} from "./dashboard.utils";

const getMetricsSummary = async (): Promise<ApiResponse<MetricsSummary>> => {
  try {
    const dates = getDashboardDates();
    const result = await dashboardRepository.getDashboardMetrics(dates);

    const saleChangePercent = result.yesterdaySaleRevenue
      ? ((result.todaySaleRevenue - result.yesterdaySaleRevenue) / result.yesterdaySaleRevenue ||
          1) * 100
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
};

const getTopProducts = async (): Promise<ApiResponse<TopProductDataPoint[]>> => {
  try {
    const result = await dashboardRepository.getTopProducts(5);

    const sum = result.reduce((acc, curr) => {
      if (!curr.totalQuantitySold) return acc;
      return curr.totalQuantitySold + acc;
    }, 0);

    return {
      status: "success",
      data: result.map((r) => ({
        id: r.id,
        name: r.name,
        totalQuantitySold: r.totalQuantitySold ? r.totalQuantitySold : 0,
        sharePercent: r.totalQuantitySold
          ? Number(((r.totalQuantitySold / sum) * 100).toFixed(2))
          : 0
      }))
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Could not fetch top products."
      }
    };
  }
};

const getRecentTransactions = async (
  type: TransactionType
): Promise<
  ApiResponse<(Sale & { customerName: string })[] | (Estimate & { customerName: string })[] | []>
> => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const result = await dashboardRepository.getRecentSales(5);

      return {
        status: "success",
        data:
          result.length > 0
            ? result.map((r) => ({
                ...r,
                transactionNo: r.invoiceNo,
                customerName: r.customer.name,
                grandTotal: r.grandTotal && formatToRupees(r.grandTotal)
              }))
            : []
      };
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const result = await dashboardRepository.getRecentEstimates(5);

      return {
        status: "success",
        data:
          result.length > 0
            ? result.map((r) => ({
                ...r,
                transactionNo: r.estimateNo,
                customerName: r.customer.name,
                grandTotal: r.grandTotal && formatToRupees(r.grandTotal)
              }))
            : []
      };
    }
    return {
      status: "success",
      data: []
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Could not fetch Recent Transactions."
      }
    };
  }
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
      sales: formatToRupees(sale.total) ?? 0,
      estimates: formatToRupees(estimate?.total as number) ?? 0
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
      sales: formatToRupees(salesMap[monthIndex]) || 0,
      estimates: formatToRupees(estimatesMap[monthIndex]) || 0
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
      sales: formatToRupees(sale.total) ?? 0,
      estimates: formatToRupees(estimate?.total as number) ?? 0
    });
  }

  return chartData;
};

const getChartMetrics = async (
  timePeriod: TimePeriodType
): Promise<ApiResponse<ChartDataType[]>> => {
  try {
    let data: ChartDataType[] = [];

    if (timePeriod === TIME_PERIOD.THIS_YEAR) {
      data = await getSalesEstimatesRevenueByMonth();
    } else if (timePeriod === TIME_PERIOD.LAST_7_DAYS) {
      data = await getSalesEstimatesRevenueByLast7Days();
    } else if (timePeriod === TIME_PERIOD.THIS_WEEK) {
      data = await getSalesEstimatesRevenueByThisWeek();
    }

    return {
      status: "success",
      data: data
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while fetching chart metrics."
      }
    };
  }
};

export const dashboardService = {
  getMetricsSummary,
  getTopProducts,
  getRecentTransactions,
  getChartMetrics
};
