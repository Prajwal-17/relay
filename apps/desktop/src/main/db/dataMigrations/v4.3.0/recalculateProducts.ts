import type { DataMigration } from "../types";

export const recalculateProducts: DataMigration = {
  id: "v4.3.0:recalculate-products",
  label: "Recalculating product activity",
  // Rebuilds each product's sold quantity and most recent activity date.
  run({ sqlite }) {
    sqlite.exec(`
      UPDATE products
      SET total_quantity_sold = COALESCE((
            SELECT SUM(quantity) FROM sale_items WHERE product_id = products.id
          ), 0) + COALESCE((
            SELECT SUM(quantity) FROM estimate_items WHERE product_id = products.id
          ), 0),
          last_sold_at = (
            SELECT MAX(item_created_at)
            FROM (
              SELECT created_at AS item_created_at
              FROM sale_items
              WHERE product_id = products.id
              UNION ALL
              SELECT created_at AS item_created_at
              FROM estimate_items
              WHERE product_id = products.id
            )
          );
    `);
  }
};
