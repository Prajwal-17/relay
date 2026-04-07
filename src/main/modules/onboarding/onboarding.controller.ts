import { Hono } from "hono";
import { onboardingSchema } from "../../../shared/schemas/onboarding.schema";
import { validateRequest } from "../../middleware/validation";
import { onboardingService } from "./onboarding.service";

export const onboardingController = new Hono();

onboardingController.post("/", validateRequest("json", onboardingSchema), async (c) => {
  const payload = c.req.valid("json");
  const result = await onboardingService.insertOnboardingData(payload);
  return c.json(result, 201);
});
