import type { OnboardingPayload } from "../../../modules/onboarding/onboarding.types";

export function onboardingPayload(overrides: Partial<OnboardingPayload> = {}): OnboardingPayload {
  return {
    storeName: "Relay Market",
    ownerName: "Prajwal Reddy",
    phone: "9876543210",
    email: "owner@example.com",
    addressLine1: "12 Market Road",
    addressLine2: null,
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
    gstin: null,
    ...overrides
  };
}
