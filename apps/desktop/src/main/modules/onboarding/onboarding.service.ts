import { db } from "../../db/db";
import { AppError } from "../../utils/appError";
import { customersRepository } from "../customers/customers.repository";
import { preferencesRepository } from "../preferences/preferences.repository";
import { onboardingRepository } from "./onboarding.repository";
import type { OnboardingPayload } from "./onboarding.types";

const getOnboardingStatus = async (storeId: string) => {
  const isOnboardingComplete = await onboardingRepository.getOnboardingStatus(storeId);
  return {
    isComplete: isOnboardingComplete
  };
};

const insertOnboardingData = async (payload: OnboardingPayload) => {
  const [appInstance] = await onboardingRepository.getAppInstance();
  const [storeProfile] = await onboardingRepository.getStoreProfile();

  if (appInstance || storeProfile) {
    throw new AppError("You have already registered. Cannot create new entry", 400);
  }

  try {
    const result = db.transaction((tx) => {
      const newAppInstance = onboardingRepository.createAppInstance(tx);

      const newStoreProfile = onboardingRepository.createStoreProfile(payload, tx);

      const defaultCustomer = customersRepository.createDefaultCustomer(newStoreProfile.id, tx);

      const defaultPreferences = preferencesRepository.createDefaultPreferences(
        newStoreProfile.id,
        defaultCustomer.id,
        tx
      );

      return {
        appInstance: newAppInstance,
        storeProfile: newStoreProfile,
        customerId: defaultCustomer.id,
        preferences: defaultPreferences
      };
    });

    return result;
  } catch (error) {
    console.error("Onboarding failed:", error);
    throw new AppError("Failed to save onboarding data", 500);
  }
};

export const onboardingService = {
  getOnboardingStatus,
  insertOnboardingData
};
