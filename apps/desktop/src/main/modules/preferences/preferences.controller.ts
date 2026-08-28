import { Hono } from "hono";
import {
  resetSectionParamSchema,
  updatePreferencesSchema
} from "../../../shared/schemas/preferences.schema";
import { validateRequest } from "../../middleware/validation";
import type { Env } from "../../server";
import { preferencesService } from "./preferences.service";

export const preferencesController = new Hono<Env>();

preferencesController.get("/", async (c) => {
  const storeId = c.var.storeId;
  const result = await preferencesService.getPreferences(storeId);
  return c.json(result, 200);
});

preferencesController.get("/defaults", async (c) => {
  const result = preferencesService.getDefaults();
  return c.json(result, 200);
});

preferencesController.patch("/", validateRequest("json", updatePreferencesSchema), async (c) => {
  const storeId = c.var.storeId;
  const payload = c.req.valid("json");
  const result = await preferencesService.updatePreferences(storeId, payload);
  return c.json(result, 200);
});

preferencesController.post(
  "/reset/:section",
  validateRequest("param", resetSectionParamSchema),
  async (c) => {
    const storeId = c.var.storeId;
    const { section } = c.req.valid("param");
    const result = await preferencesService.resetSection(storeId, section);
    return c.json(result, 200);
  }
);
