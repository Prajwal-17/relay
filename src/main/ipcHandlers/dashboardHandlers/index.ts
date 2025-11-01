import { getChartMetrics } from "./getChartMetrics";
import { getMetricsSummary } from "./getMetricsSummary";
import { getRecentTransactions } from "./getRecentTransactions";
import { getTopProducts } from "./getTopProducts";

export function dashboardHandlers() {
  getMetricsSummary();
  getChartMetrics();
  getRecentTransactions();
  getTopProducts();
}
