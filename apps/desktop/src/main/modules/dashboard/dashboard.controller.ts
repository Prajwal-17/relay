import { Hono } from "hono";
import { validateRequest } from "../../middleware/validation";
import { timePeriodQuerySchema, transactionTypeParamSchema } from "./dashboard.schema";
import { dashboardService } from "./dashboard.service";

export const dashboardController = new Hono();

// get dashboard metrics summary
dashboardController.get("/summary", async (c) => {
  const result = await dashboardService.getMetricsSummary();
  return c.json(result, 200);
});

// get sales vs estimates chart data
dashboardController.get(
  "/sales-vs-estimates",
  validateRequest("query", timePeriodQuerySchema),
  async (c) => {
    const { timePeriod } = c.req.valid("query");
    const result = await dashboardService.getChartMetrics(timePeriod);
    return c.json(result, 200);
  }
);

// get top products
dashboardController.get("/top-products", async (c) => {
  const result = await dashboardService.getTopProducts();
  return c.json(result, 200);
});

// get recent transactions by type
dashboardController.get(
  "/recent-transactions/:type",
  validateRequest("param", transactionTypeParamSchema),
  async (c) => {
    const { type } = c.req.valid("param");
    const result = await dashboardService.getRecentTransactions(type);
    return c.json(result, 200);
  }
);
