PRAGMA foreign_keys = ON;

CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX "session_user_id_idx" ON "session" ("userId");

CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" INTEGER,
  "refreshTokenExpiresAt" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  UNIQUE ("providerId", "accountId")
);

CREATE INDEX "account_user_id_idx" ON "account" ("userId");

CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "createdAt" INTEGER,
  "updatedAt" INTEGER
);

CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE "daily_entries" (
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "entry_date" TEXT NOT NULL,
  "cash_paisa" INTEGER NOT NULL DEFAULT 0 CHECK ("cash_paisa" >= 0),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("user_id", "entry_date")
);

CREATE TABLE "online_channels" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "is_preset" INTEGER NOT NULL DEFAULT 0 CHECK ("is_preset" IN (0, 1)),
  "is_archived" INTEGER NOT NULL DEFAULT 0 CHECK ("is_archived" IN (0, 1)),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE UNIQUE INDEX "online_channels_user_name_unique"
  ON "online_channels" ("user_id", "name" COLLATE NOCASE);
CREATE UNIQUE INDEX "online_channels_user_id_id_unique"
  ON "online_channels" ("user_id", "id");

CREATE TABLE "daily_online_receipts" (
  "user_id" TEXT NOT NULL,
  "entry_date" TEXT NOT NULL,
  "channel_id" INTEGER NOT NULL,
  "amount_paisa" INTEGER NOT NULL CHECK ("amount_paisa" > 0),
  PRIMARY KEY ("user_id", "entry_date", "channel_id"),
  FOREIGN KEY ("user_id", "entry_date")
    REFERENCES "daily_entries" ("user_id", "entry_date") ON DELETE CASCADE,
  FOREIGN KEY ("user_id", "channel_id")
    REFERENCES "online_channels" ("user_id", "id") ON DELETE RESTRICT
);

CREATE TABLE "supplier_payments" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "entry_date" TEXT NOT NULL,
  "payee" TEXT NOT NULL,
  "amount_paisa" INTEGER NOT NULL CHECK ("amount_paisa" > 0),
  "note" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("user_id", "entry_date")
    REFERENCES "daily_entries" ("user_id", "entry_date") ON DELETE CASCADE
);

CREATE INDEX "supplier_payments_user_date_idx"
  ON "supplier_payments" ("user_id", "entry_date", "position");

CREATE TABLE "receipt_events" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "entry_date" TEXT NOT NULL,
  "channel_id" INTEGER,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('opening', 'payment', 'adjustment')),
  "amount_paisa" INTEGER NOT NULL CHECK ("amount_paisa" <> 0),
  "balance_paisa" INTEGER NOT NULL CHECK ("balance_paisa" >= 0),
  "recorded_at" TEXT,
  "name" TEXT,
  FOREIGN KEY ("user_id", "entry_date")
    REFERENCES "daily_entries" ("user_id", "entry_date") ON DELETE CASCADE,
  FOREIGN KEY ("user_id", "channel_id")
    REFERENCES "online_channels" ("user_id", "id") ON DELETE RESTRICT,
  CHECK (("kind" = 'opening' AND "recorded_at" IS NULL) OR
         ("kind" <> 'opening' AND "recorded_at" IS NOT NULL))
);

CREATE INDEX "receipt_events_user_method_idx"
  ON "receipt_events" ("user_id", "entry_date", "channel_id", "id");
