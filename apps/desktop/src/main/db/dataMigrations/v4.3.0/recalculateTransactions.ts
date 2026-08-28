import type { DataMigration } from "../types";

export const recalculateTransactions: DataMigration = {
  id: "v4.3.0:recalculate-transactions",
  label: "Recalculating invoice totals",
  // Rebuilds sale and estimate totals from their saved item rows.
  run({ sqlite }) {
    sqlite.exec(`
      UPDATE sales
      SET total_quantity = COALESCE((
            SELECT SUM(quantity) FROM sale_items WHERE sale_id = sales.id
          ), 0),
          grand_total = COALESCE((
            SELECT SUM(total_price) FROM sale_items WHERE sale_id = sales.id
          ), 0);

      UPDATE estimates
      SET total_quantity = COALESCE((
            SELECT SUM(quantity) FROM estimate_items WHERE estimate_id = estimates.id
          ), 0),
          grand_total = COALESCE((
            SELECT SUM(total_price) FROM estimate_items WHERE estimate_id = estimates.id
          ), 0);
    `);
  }
};
