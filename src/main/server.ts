import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { productsController } from "./modules/products/products.controller";

const app = new Hono();

app.use("/*", cors());
app.route("/api/products", productsController);

export function startServer() {
  const port = 3000;
  console.log("Starting Hono server");

  const server = serve({
    fetch: app.fetch,
    port
  });

  return server;
}
