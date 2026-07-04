import { Hono } from "hono";
import { updateStoreProfileSchema } from "../../../shared/schemas/storeProfile.schema";
import { validateRequest } from "../../middleware/validation";
import type { Env } from "../../server";
import { storeProfileService } from "./storeProfile.service";

export const storeProfileController = new Hono<Env>();

storeProfileController.get("/", async (c) => {
  const storeId = c.var.storeId;
  const result = await storeProfileService.getStoreProfile(storeId);
  return c.json(result, 200);
});

storeProfileController.patch("/", validateRequest("json", updateStoreProfileSchema), async (c) => {
  const storeId = c.var.storeId;
  const payload = c.req.valid("json");
  const result = await storeProfileService.updateStoreProfile(storeId, payload);
  return c.json(result, 200);
});
