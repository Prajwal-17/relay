import { serve } from "@hono/node-server";
import { SqliteError } from "better-sqlite3";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger, loggerInstance } from "./middleware/logger";
import { customersController } from "./modules/customers/customers.controller";
import { dashboardController } from "./modules/dashboard/dashboard.controller";
import { estimatesController } from "./modules/estimates/estimates.controller";
import { onboardingController } from "./modules/onboarding/onboarding.controller";
import { productsController } from "./modules/products/products.controller";
import { salesController } from "./modules/sales/sales.controller";
import { AppError } from "./utils/appError";

const mode = process.env.MODE || process.env.NODE_ENV || "production";

const app = new Hono();

app.use(logger);

app.use("/*", cors());

app.onError((err, c) => {
  console.error(`[Error]: ${c.req.method} ${c.req.url}:`);
  loggerInstance.error(err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: { message: err.message }
      },
      err.status
    );
  }

  if (err instanceof SqliteError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message
        }
      },
      400
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        error: { message: err.message }
      },
      err.statusCode as any
    );
  }

  return c.json(
    {
      error: {
        message: "Internal Server Error"
      }
    },
    500
  );
});

app.route("/api/onboarding", onboardingController);
app.route("/api/dashboard", dashboardController);
app.route("/api/products", productsController);
app.route("/api/customers", customersController);
app.route("/api/sales", salesController);
app.route("/api/estimates", estimatesController);

export function startServer() {
  const port = mode === "production" ? 4722 : 4723;
  console.log("Hono server running on port", port);

  const server = serve({
    fetch: app.fetch,
    port
  });

  return server;
}

startServer();
