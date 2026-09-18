import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "./app-env";
import { createAuth } from "./auth";
import { requireSession } from "./middleware/session";
import { moneyRoutes } from "./modules/money/money.routes";

const app = new Hono<AppEnv>();

app.use("/api/*", async (context, next) => {
  const allowed = new Set(
    context.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
  const handleCors = cors({
    origin: (origin) => (allowed.has(origin) ? origin : ""),
    allowHeaders: ["Content-Type", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400
  });
  return handleCors(context, next);
});

app.get("/health", (context) =>
  context.json({ service: "relay-server", status: "ok" as const })
);

app.all("/api/auth/*", (context) => createAuth(context.env).handler(context.req.raw));

app.use("/api/money/*", requireSession);
app.route("/api/money", moneyRoutes);

app.notFound((context) => context.json({ error: { message: "Route not found." } }, 404));

app.onError((error, context) => {
  if (error instanceof HTTPException) {
    return context.json({ error: { message: error.message } }, error.status);
  }

  console.error(
    JSON.stringify({
      message: "unhandled request error",
      error: error instanceof Error ? error.message : String(error),
      method: context.req.method,
      path: context.req.path
    })
  );
  return context.json({ error: { message: "Internal server error." } }, 500);
});

export default app;
