import { SqliteError } from "better-sqlite3";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { productsController } from "../../modules/products/products.controller";
import { AppError } from "../../utils/appError";

type TestEnv = {
  Variables: {
    storeId: string;
    settings: Record<string, unknown>;
  };
};

type ModuleRoute = {
  path: string;
  controller: Hono<any>;
};

export function createModuleTestApp(routes: ModuleRoute[]) {
  const app = new Hono<TestEnv>();

  app.use("*", async (c, next) => {
    c.set("storeId", "default");
    c.set("settings", {});
    await next();
  });

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: { message: err.message } }, err.status);
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
      return c.json({ error: { message: err.message } }, err.statusCode as 400 | 404 | 500);
    }

    return c.json({ error: { message: "Internal Server Error" } }, 500);
  });

  for (const route of routes) {
    app.route(route.path, route.controller);
  }

  return app;
}

export function createProductsTestApp() {
  return createModuleTestApp([{ path: "/api/products", controller: productsController }]);
}
