/** Fresh, Money-only schema. No desktop data or non-Money tables are imported. */
export const ledgerV1 = `
  CREATE TABLE IF NOT EXISTS daily_entries (
    entry_date TEXT PRIMARY KEY NOT NULL,
    cash_paisa INTEGER NOT NULL DEFAULT 0 CHECK (cash_paisa >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS online_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    is_preset INTEGER NOT NULL DEFAULT 0 CHECK (is_preset IN (0, 1)),
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_online_receipts (
    entry_date TEXT NOT NULL REFERENCES daily_entries(entry_date) ON DELETE CASCADE,
    channel_id INTEGER NOT NULL REFERENCES online_channels(id) ON DELETE RESTRICT,
    amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
    PRIMARY KEY (entry_date, channel_id)
  );

  CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL REFERENCES daily_entries(entry_date) ON DELETE CASCADE,
    payee TEXT NOT NULL,
    amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
    note TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS supplier_payments_entry_date_idx
    ON supplier_payments(entry_date, position);

  CREATE TABLE IF NOT EXISTS receipt_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL REFERENCES daily_entries(entry_date) ON DELETE CASCADE,
    channel_id INTEGER REFERENCES online_channels(id) ON DELETE RESTRICT,
    kind TEXT NOT NULL CHECK (kind IN ('opening', 'payment', 'adjustment')),
    amount_paisa INTEGER NOT NULL CHECK (amount_paisa <> 0),
    balance_paisa INTEGER NOT NULL CHECK (balance_paisa >= 0),
    recorded_at TEXT,
    name TEXT,
    CHECK ((kind = 'opening' AND recorded_at IS NULL) OR
           (kind <> 'opening' AND recorded_at IS NOT NULL))
  );

  CREATE INDEX IF NOT EXISTS receipt_events_method_idx
    ON receipt_events(entry_date, channel_id, id);

  INSERT OR IGNORE INTO online_channels
    (name, is_preset, is_archived, created_at, updated_at)
  VALUES
    ('Paytm', 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('PhonePe', 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('Google Pay', 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('Other', 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
`;
