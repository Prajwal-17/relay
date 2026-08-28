import { backfillStoreIds } from "./v4.3.0/backfillStoreIds";
import { cleanProductHistory } from "./v4.3.0/cleanProductHistory";
import { createLegacyDefaults } from "./v4.3.0/defaultRecords";
import { rebuildSnapshots } from "./v4.3.0/rebuildSnapshots";
import { recalculateItemPositions } from "./v4.3.0/recalculateItemPositions";
import { recalculateProducts } from "./v4.3.0/recalculateProducts";
import { recalculateTransactions } from "./v4.3.0/recalculateTransactions";

export const dataMigrationRegistry = [
  createLegacyDefaults,
  backfillStoreIds,
  rebuildSnapshots,
  recalculateItemPositions,
  recalculateTransactions,
  recalculateProducts,
  cleanProductHistory
] as const;
