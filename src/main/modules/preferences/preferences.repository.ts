import { eq } from "drizzle-orm";
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

const createDefaultPreferences = (storeId: string, defaultCustomerId: string, tx: any) => {
  const config: AppConfig = {
    billing: {
      defaultCustomerId: defaultCustomerId
    },
    exports: {
      askBeforeSavingPdf: true,
      defaultPdfLocation: "",
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
  createDefaultPreferences
};
