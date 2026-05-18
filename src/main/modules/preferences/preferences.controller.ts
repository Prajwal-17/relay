import { Hono } from "hono";
import type { Env } from "../../server";
import { preferencesService } from "./preferences.service";

export const preferencesController = new Hono<Env>();

preferencesController.get("/", async (c) => {
  const storeId = c.var.storeId;
  const result = await preferencesService.getPreferences(storeId);
  return c.json(result, 200);
});
