import { eq, sql } from "drizzle-orm";
import os from "os";
import path from "path";
import type { AppConfig } from "../../../shared/types";
import { db } from "../../db/db";
import { appPreferences } from "../../db/schema";

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
  const config: AppConfig = {
    billing: {
      defaultCustomerId: defaultCustomerId
    },
    exports: {
      askBeforeSavingPdf: true,
      defaultPdfLocation: path.join(os.homedir(), "Downloads"),
      defaultExportFormat: "pdf"
    }
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

export const preferencesRepository = {
  getPreferences,
  updatePreferences,
  createDefaultPreferences
};
