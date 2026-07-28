import type { DataMigration } from "../types";

const POSITION_GAP = 65_536;

export const recalculateItemPositions: DataMigration = {
  id: "v4.3.0:recalculate-item-positions",
  label: "Ordering invoice items",
  // Gives every sale and estimate item a stable position in its original order.
  run({ sqlite }) {
    const itemTables = [
      { table: "sale_items", parentColumn: "sale_id" },
      { table: "estimate_items", parentColumn: "estimate_id" }
    ] as const;

    for (const { table, parentColumn } of itemTables) {
      const items = sqlite
        .prepare(
          `SELECT id, ${parentColumn} AS parent_id
           FROM ${table}
           ORDER BY ${parentColumn}, created_at, id`
        )
        .all() as { id: string; parent_id: string }[];
      const updatePosition = sqlite.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`);

      let currentParent: string | undefined;
      let position = 0;

      for (const item of items) {
        if (item.parent_id !== currentParent) {
          currentParent = item.parent_id;
          position = 0;
        }

        updatePosition.run(position, item.id);
        position += POSITION_GAP;
      }
    }
  }
};
