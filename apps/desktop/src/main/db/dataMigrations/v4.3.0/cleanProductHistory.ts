import type { DataMigration } from "../types";

export const cleanProductHistory: DataMigration = {
  id: "v4.3.0:clean-product-history",
  label: "Cleaning empty price history",
  // Removes history rows that never recorded any price change.
  run({ sqlite }) {
    sqlite.exec(`
      DELETE FROM product_history
      WHERE old_price IS NULL
        AND new_price IS NULL
        AND old_mrp IS NULL
        AND new_mrp IS NULL
        AND old_purchase_price IS NULL
        AND new_purchase_price IS NULL;
    `);
  }
};
