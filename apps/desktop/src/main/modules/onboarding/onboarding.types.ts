import type z from "zod";
import type { onboardingSchema } from "../../../shared/schemas/onboarding.schema";

export type OnboardingPayload = z.infer<typeof onboardingSchema>;
