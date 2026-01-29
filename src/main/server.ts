import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { customersController } from "./modules/customers/customers.controller";
import { dashboardController } from "./modules/dashboard/dashboard.controller";
import { estimatesController } from "./modules/estimates/estimates.controller";
import { productsController } from "./modules/products/products.controller";
import { salesController } from "./modules/sales/sales.controller";

const app = new Hono();

app.use("/*", cors());
app.route("/api/dashboard", dashboardController);
app.route("/api/products", productsController);
app.route("/api/customers", customersController);
app.route("/api/sales", salesController);
app.route("/api/estimates", estimatesController);

export function startServer() {
  const port = 3000;
  console.log("Starting Hono server");

  const server = serve({
    fetch: app.fetch,
    port
  });

  return server;
}
