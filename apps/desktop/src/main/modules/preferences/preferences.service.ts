import type { UpdatePreferencesPayload } from "../../../shared/schemas/preferences.schema";
import { AppError } from "../../utils/appError";
import { preferencesRepository } from "./preferences.repository";

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

export const preferencesService = {
  getPreferences,
  updatePreferences
};
