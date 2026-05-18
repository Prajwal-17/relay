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

const getOnboardingStatus = async (storeId: string) => {
  const store = db
    .select({ id: storeProfile.id })
    .from(storeProfile)
    .where(eq(storeProfile.id, storeId))
    .limit(1)
    .all();
  return store.length > 0;
};

const createAppInstance = (tx: any) => {
  return tx
    .insert(appInstance)
    .values({
      id: "default",
      os: getOS(),
      installedAt: new Date().toISOString()
    })
    .returning({
      id: appInstance.id,
      os: appInstance.os
    })
    .get();
};

const createStoreProfile = (payload: OnboardingPayload, tx: any) => {
  return tx
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
    .returning({
      id: storeProfile.id,
      storeName: storeProfile.storeName,
      ownerName: storeProfile.ownerName,
      phone: storeProfile.phone,
      email: storeProfile.email,
      addressLine1: storeProfile.addressLine1,
      addressLine2: storeProfile.addressLine2,
      country: storeProfile.country,
      state: storeProfile.state,
      pincode: storeProfile.pincode,
      city: storeProfile.city,
      gstin: storeProfile.gstin
    })
    .get();
};

export const onboardingRepository = {
  getAppInstance,
  getStoreProfile,
  getOnboardingStatus,
  createAppInstance,
  createStoreProfile
};
