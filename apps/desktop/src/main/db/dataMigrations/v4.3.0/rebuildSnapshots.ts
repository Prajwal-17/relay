import { generateProductSnapshot } from "../../../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../../../shared/utils/utils";
import type { DataMigration } from "../types";

type SnapshotRow = {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
};

// Builds a product label from the values saved on this exact row.
function snapshotFor(row: SnapshotRow): string {
  return generateProductSnapshot({
    name: row.name,
    weight: row.weight,
    unit: row.unit,
    mrp: row.mrp === null ? null : paisaToRupees(row.mrp)
  });
}

export const rebuildSnapshots: DataMigration = {
  id: "v4.3.0:rebuild-snapshots",
  label: "Refreshing product labels",
  // Refreshes product labels and fills only blank labels on old items.
  run({ sqlite }) {
    const updateProduct = sqlite.prepare("UPDATE products SET product_snapshot = ? WHERE id = ?");
    const products = sqlite
      .prepare("SELECT id, name, weight, unit, mrp FROM products")
      .all() as SnapshotRow[];
    for (const product of products) updateProduct.run(snapshotFor(product), product.id);

    for (const table of ["sale_items", "estimate_items"]) {
      const rows = sqlite
        .prepare(
          `SELECT id, name, weight, unit, mrp FROM ${table}
           WHERE product_snapshot IS NULL OR TRIM(product_snapshot) = ''`
        )
        .all() as SnapshotRow[];
      const update = sqlite.prepare(`UPDATE ${table} SET product_snapshot = ? WHERE id = ?`);
      for (const row of rows) update.run(snapshotFor(row), row.id);
    }
  }
};
