import type { UpdateStoreProfilePayload } from "../../../shared/schemas/storeProfile.schema";
import { AppError } from "../../utils/appError";
import { storeProfileRepository } from "./storeProfile.repository";

const getStoreProfile = async (storeId: string) => {
  const profile = await storeProfileRepository.getStoreProfile(storeId);

  if (!profile) {
    throw new AppError("Store profile not found", 404);
  }

  return profile;
};

const updateStoreProfile = async (storeId: string, data: UpdateStoreProfilePayload) => {
  const existing = await storeProfileRepository.getStoreProfile(storeId);

  if (!existing) {
    throw new AppError("Store profile not found", 404);
  }

  const updated = await storeProfileRepository.updateStoreProfile(storeId, data);
  return updated;
};

export const storeProfileService = {
  getStoreProfile,
  updateStoreProfile
};
