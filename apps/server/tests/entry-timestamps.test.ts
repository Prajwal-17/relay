import assert from "node:assert/strict";
import { test } from "node:test";
import { testDatabase } from "./database.ts";

for (const state of ["populated", "deleted", "fresh"] as const) {
  test(`combined money migration preserves ${state} ledgers with foreign keys enabled`, () => {
    const db = testDatabase({ legacy: true });
    try {
      db.user("a");
      db.user("b");
      assert.equal(db.sqlite.prepare("PRAGMA foreign_keys").get()!.foreign_keys, 1);
      const created = "2026-10-03T18:30:00.000Z";
      const method = db.sqlite
        .prepare(
          "INSERT INTO payment_methods (user_id, name, created_at, updated_at) VALUES ('a', 'PhonePe', ?, ?) RETURNING id"
        )
        .get(created, created)!.id;
      const tables = ["received_entries", "vendor_payments"] as const;
      if (state !== "fresh") {
        db.sqlite
          .prepare(
            "INSERT INTO received_entries (id, user_id, entry_date, payment_method_id, amount, note, created_at) VALUES (?, ?, '2026-10-01', ?, 125, 'Original note', ?)"
          )
          .run(10, "a", method, created);
        db.sqlite
          .prepare(
            "INSERT INTO received_entries (id, user_id, entry_date, amount, created_at) VALUES (200, 'b', '2026-10-02', 200, ?)"
          )
          .run(created);
        db.sqlite
          .prepare(
            "INSERT INTO vendor_payments (id, user_id, entry_date, vendor_name, amount, note, created_at) VALUES (?, ?, '2026-10-01', 'Vendor', 125, 'Original note', ?)"
          )
          .run(10, "a", created);
        db.sqlite
          .prepare(
            "INSERT INTO vendor_payments (id, user_id, entry_date, vendor_name, amount, created_at) VALUES (200, 'b', '2026-10-02', 'Other vendor', 200, ?)"
          )
          .run(created);
        for (const table of tables)
          db.sqlite.exec(
            `DELETE FROM ${table} WHERE ${state === "deleted" ? "1 = 1" : "id = 200"}`
          );
      }
      const snapshots = tables.map((table) => ({
        rows: db.sqlite
          .prepare(`SELECT * FROM ${table} ORDER BY id`)
          .all()
          .map((row) => ({ ...row })),
        foreignKeys: db.sqlite.prepare(`PRAGMA foreign_key_list(${table})`).all()
      }));
      db.migrate();
      for (const [index, table] of tables.entries()) {
        const rows = db.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
        assert.deepEqual(
          rows.map(({ updated_at, ...row }) => row),
          snapshots[index].rows
        );
        for (const row of rows) assert.equal(row.updated_at, row.created_at);
        assert.deepEqual(
          db.sqlite.prepare(`PRAGMA foreign_key_list(${table})`).all(),
          snapshots[index].foreignKeys
        );
        assert.equal(
          db.sqlite
            .prepare(`PRAGMA table_info(${table})`)
            .all()
            .find((column) => column.name === "updated_at")!.notnull,
          1
        );
        assert.ok(
          db.sqlite
            .prepare(`PRAGMA index_list(${table})`)
            .all()
            .some(
              (index) =>
                index.name ===
                (table === "received_entries"
                  ? "received_entries_user_method_idx"
                  : "vendor_payments_user_date_idx")
            )
        );
        const identityColumn = table === "received_entries" ? "payment_method_id" : "vendor_name";
        const identityValue = table === "received_entries" ? method : "Vendor";
        const insert = db.sqlite.prepare(
          `INSERT INTO ${table} (user_id, entry_date, ${identityColumn}, amount, created_at, updated_at) VALUES (?, '2026-10-04', ?, ?, ?, ?) RETURNING id`
        );
        assert.throws(() => insert.get("a", identityValue, 100, created, null), /NOT NULL/);
        assert.throws(() => insert.get("a", identityValue, -100, created, created), /CHECK/);
        assert.throws(
          () => insert.get("missing", identityValue, 100, created, created),
          /FOREIGN KEY/
        );
        assert.equal(
          insert.get("a", identityValue, 100, created, created)!.id,
          state === "fresh" ? 1 : 201
        );
      }
      assert.deepEqual(db.sqlite.prepare("PRAGMA foreign_key_check").all(), []);
      assert.equal(db.sqlite.prepare("PRAGMA foreign_keys").get()!.foreign_keys, 1);
    } finally {
      db.sqlite.close();
    }
  });
}
