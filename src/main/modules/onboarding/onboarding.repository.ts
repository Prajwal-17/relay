import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { appInstance, storeProfile } from "../../db/schema";
import { getOS } from "../../utils/onboarding.utils";
import type { OnboardingPayload } from "./onboarding.types";

const getAppInstance = async () => {
  return db.select().from(appInstance).where(eq(appInstance.id, "default"));
};

const getStoreProfile = async () => {
  return db.select().from(storeProfile).where(eq(storeProfile.id, "default"));
};

const insertOnboardingData = async (payload: OnboardingPayload) => {
  return db.transaction((tx) => {
    tx.insert(appInstance).values({
      id: "default",
      os: getOS(),
      installedAt: new Date().toISOString()
    });
    const profile = tx
      .insert(storeProfile)
      .values({
        id: "default",
        storeName: payload.storeName,
        ownerName: payload.ownerName,
        phone: payload.phone,
        email: payload.email,
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2,
        country: payload.country,
        state: payload.state,
        city: payload.city,
        pincode: payload.pincode,
        gstin: payload.gstin
      })
      .returning();
    return profile[0];
  });
};

export const onboardingRepository = {
  getAppInstance,
  getStoreProfile,
  insertOnboardingData
};
