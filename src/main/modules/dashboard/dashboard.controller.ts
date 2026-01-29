import { Hono } from "hono";
import { type TransactionType } from "../../../shared/types";
import { dashboardService } from "./dashboard.service";

export const dashboardController = new Hono();

dashboardController.get("/summary", async (c) => {
  try {
    const result = await dashboardService.getMetricsSummary();
    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

dashboardController.get("/sales-vs-estimates", async (c) => {
  try {
    const timePeriod = c.req.query("timePeriod") as any;
    const result = await dashboardService.getChartMetrics(timePeriod);
    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

dashboardController.get("/top-products", async (c) => {
  try {
    const result = await dashboardService.getTopProducts();
    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

dashboardController.get("/recent-transactions/:type", async (c) => {
  try {
    const type = c.req.param("type");
    // const limit = c.req.query("limit");
    const result = await dashboardService.getRecentTransactions(type as TransactionType);
    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});
