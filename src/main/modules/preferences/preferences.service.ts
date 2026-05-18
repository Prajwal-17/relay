import { AppError } from "../../utils/appError";
import { preferencesRepository } from "./preferences.repository";

const getPreferences = async (storeId: string) => {
  const prefs = await preferencesRepository.getPreferences(storeId);

  if (!prefs) {
    throw new AppError("Preferences not found", 404);
  }
  return prefs;
};

export const preferencesService = {
  getPreferences
};
