import { getChartMetrics } from "./getChartMetrics";
import { getMetricsSummary } from "./getMetricsSummary";

export function dashboardHandlers() {
  getMetricsSummary();
  getChartMetrics();
}
