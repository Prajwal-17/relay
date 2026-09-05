import { eq, sql } from "drizzle-orm";
import type { AppConfig } from "../../../shared/types";
import { db } from "../../db/db";
import { appPreferences } from "../../db/schema";
import { getDefaultConfig } from "./preferences.defaults";
const getPreferences = async (storeId: string) => {
  return db
    .select({
      id: appPreferences.id,
      storeId: appPreferences.storeId,
      config: appPreferences.config
    })
    .from(appPreferences)
    .where(eq(appPreferences.storeId, storeId))
    .limit(1)
    .get();
};

const updatePreferences = async (storeId: string, config: AppConfig) => {
  return db
    .update(appPreferences)
    .set({
      config,
      updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .where(eq(appPreferences.storeId, storeId))
    .returning({
      id: appPreferences.id,
      storeId: appPreferences.storeId,
      config: appPreferences.config
    })
    .get();
};

const createDefaultPreferences = (storeId: string, defaultCustomerId: string, tx: any) => {
  const defaults = getDefaultConfig();
  const config: AppConfig = {
    ...defaults,
    billing: { ...defaults.billing, defaultCustomerId }
  };

  return tx
    .insert(appPreferences)
    .values({
      storeId: storeId,
      config
    })
    .returning({
      id: appPreferences.id,
      storeId: appPreferences.storeId,
      config: appPreferences.config
    })
    .get();
};

const resetSectionConfig = async (storeId: string, config: AppConfig) => {
  return updatePreferences(storeId, config);
};

export const preferencesRepository = {
  getPreferences,
  updatePreferences,
  createDefaultPreferences,
  resetSectionConfig
};
