import type { UpdatePreferencesPayload } from "../../../shared/schemas/preferences.schema";
import type { AppConfig } from "../../../shared/types";
import { AppError } from "../../utils/appError";
import { getDefaultConfig, getDefaultExportsConfig } from "./preferences.defaults";
import { preferencesRepository } from "./preferences.repository";

const ALLOWED_RESET_SECTIONS = ["exports"] as const;
type ResetSection = (typeof ALLOWED_RESET_SECTIONS)[number];

const getPreferences = async (storeId: string) => {
  const prefs = await preferencesRepository.getPreferences(storeId);

  if (!prefs) {
    throw new AppError("Preferences not found", 404);
  }
  return prefs;
};

const updatePreferences = async (storeId: string, partial: UpdatePreferencesPayload) => {
  const existing = await preferencesRepository.getPreferences(storeId);

  if (!existing) {
    throw new AppError("Preferences not found", 404);
  }

  const mergedConfig = {
    billing: {
      ...existing.config.billing,
      ...(partial.billing ?? {})
    },
    exports: {
      ...existing.config.exports,
      ...(partial.exports ?? {})
    }
  };

  const updated = await preferencesRepository.updatePreferences(storeId, mergedConfig);
  return updated;
};

const getDefaults = (): AppConfig => {
  return getDefaultConfig();
};

const resetSection = async (storeId: string, section: string) => {
  if (!ALLOWED_RESET_SECTIONS.includes(section as ResetSection)) {
    throw new AppError("Unknown section", 404);
  }

  const existing = await preferencesRepository.getPreferences(storeId);
  if (!existing) {
    throw new AppError("Preferences not found", 404);
  }

  const mergedConfig: AppConfig = {
    ...existing.config,
    exports: getDefaultExportsConfig()
  };

  return preferencesRepository.resetSectionConfig(storeId, mergedConfig);
};

export const preferencesService = {
  getPreferences,
  updatePreferences,
  getDefaults,
  resetSection
};
