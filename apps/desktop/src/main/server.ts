import { serve } from "@hono/node-server";
import { SqliteError } from "better-sqlite3";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { timingSafeEqual } from "node:crypto";
import { initDb } from "./db/db";
import { logger, loggerInstance } from "./middleware/logger";
import { customersController } from "./modules/customers/customers.controller";
import { dashboardController } from "./modules/dashboard/dashboard.controller";
import { estimatesController } from "./modules/estimates/estimates.controller";
import { onboardingController } from "./modules/onboarding/onboarding.controller";
import { preferencesController } from "./modules/preferences/preferences.controller";
import { productsController } from "./modules/products/products.controller";
import { salesController } from "./modules/sales/sales.controller";
import { storeProfileController } from "./modules/storeProfile/storeProfile.controller";
import { AppError } from "./utils/appError";
import { resolveApiPort, STANDALONE_DEVELOPMENT_API_TOKEN } from "../shared/runtimeConfig";

export type Env = {
  Variables: {
    storeId: string;
    settings: Record<string, any>;
  };
};

const mode = process.env.MODE || process.env.NODE_ENV || "production";
const apiToken =
  process.env.M_VITE_API_TOKEN?.trim() ||
  (mode === "development" ? STANDALONE_DEVELOPMENT_API_TOKEN : undefined);

const app = new Hono<Env>();

app.use(logger);

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (origin === "null") return origin;

      const allowedOrigins = new Set<string>();
      const rendererUrl = process.env.ELECTRON_RENDERER_URL;
      if (rendererUrl) {
        try {
          allowedOrigins.add(new URL(rendererUrl).origin);
        } catch {
          return null;
        }
      }

      if (mode === "development") {
        try {
          const url = new URL(origin);
          if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
            return origin;
          }
        } catch {
          return null;
        }
      }

      return allowedOrigins.has(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "X-QuickCart-Api-Token"]
  })
);

function hasValidApiToken(value: string | undefined): boolean {
  if (!apiToken || !value) return false;
  const expected = Buffer.from(apiToken);
  const provided = Buffer.from(value);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

app.use("/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  if (!hasValidApiToken(c.req.header("x-quickcart-api-token"))) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }
  await next();
});

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

// set storeProfile.id globally
app.use("/*", async (c, next) => {
  c.set("storeId", "default");
  await next();
});

app.route("/api/onboarding", onboardingController);
app.route("/api/dashboard", dashboardController);
app.route("/api/products", productsController);
app.route("/api/customers", customersController);
app.route("/api/sales", salesController);
app.route("/api/estimates", estimatesController);
app.route("/api/app-preferences", preferencesController);
app.route("/api/store-profile", storeProfileController);

export async function startServer() {
  if (!apiToken) throw new Error("M_VITE_API_TOKEN is required to start the local API.");
  await initDb();

  const port = resolveApiPort(process.env.M_VITE_API_PORT, mode);
  console.log("Hono server running on port", port);

  const server = serve({
    fetch: app.fetch,
    port,
    hostname: "127.0.0.1"
  });

  return server;
}

startServer()
  .then(() => {
    process.send?.("server-ready");
  })
  .catch((error) => {
    console.error("Failed to start the QuickCart server", error);
    process.exitCode = 1;
  });
