import { getChartMetrics } from "./getChartMetrics";
import { getMetricsSummary } from "./getMetricsSummary";
import { getRecentTransactions } from "./getRecentTransactions";

export function dashboardHandlers() {
  getMetricsSummary();
  getChartMetrics();
  getRecentTransactions();
}
