import { eq, sql } from "drizzle-orm";
import type { UpdateStoreProfilePayload } from "../../../shared/schemas/storeProfile.schema";
import { db } from "../../db/db";
import { storeProfile } from "../../db/schema";

const getStoreProfile = async (storeId: string) => {
  return db.select().from(storeProfile).where(eq(storeProfile.id, storeId)).get();
};

const updateStoreProfile = async (storeId: string, data: UpdateStoreProfilePayload) => {
  return db
    .update(storeProfile)
    .set({
      ...data,
      updatedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    })
    .where(eq(storeProfile.id, storeId))
    .returning()
    .get();
};

export const storeProfileRepository = {
  getStoreProfile,
  updateStoreProfile
};
