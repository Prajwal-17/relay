import { Hono } from "hono";
import { onboardingSchema } from "../../../shared/schemas/onboarding.schema";
import { validateRequest } from "../../middleware/validation";
import type { Env } from "../../server";
import { onboardingService } from "./onboarding.service";

export const onboardingController = new Hono<Env>();

onboardingController.post("/", validateRequest("json", onboardingSchema), async (c) => {
  const payload = c.req.valid("json");
  const result = await onboardingService.insertOnboardingData(payload);
  return c.json(result, 201);
});

onboardingController.get("/status", async (c) => {
  const storeId = c.var.storeId;
  const result = await onboardingService.getOnboardingStatus(storeId);
  return c.json(result, 200);
});
