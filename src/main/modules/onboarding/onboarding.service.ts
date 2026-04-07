import { AppError } from "../../utils/appError";
import { onboardingRepository } from "./onboarding.repository";
import type { OnboardingPayload } from "./onboarding.types";

const insertOnboardingData = async (payload: OnboardingPayload) => {
  const [appInstance] = await onboardingRepository.getAppInstance();
  const [storeProfile] = await onboardingRepository.getStoreProfile();

  console.log(appInstance, storeProfile);
  if (appInstance.id || storeProfile.id) {
    throw new AppError("You have already registed. Cannot create new entry", 400);
  }

  const result = await onboardingRepository.insertOnboardingData(payload);
  if (!result) {
    throw new AppError("Failed to save onboarding data", 500);
  }

  return result;
};

export const onboardingService = {
  insertOnboardingData
};
