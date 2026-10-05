-- Preserve provider IDs and every historical receipt. Names use the same NOCASE
-- comparison as payment_methods_user_name_unique.
INSERT INTO payment_methods (user_id, name, is_preset, is_archived, created_at, updated_at)
SELECT u.id, p.name, 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM user u CROSS JOIN (SELECT 'PhonePe' AS name UNION ALL SELECT 'Paytm') p
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods existing
  WHERE existing.user_id = u.id AND existing.name = p.name COLLATE NOCASE
);
--> statement-breakpoint
UPDATE payment_methods
SET is_preset = 1, is_archived = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE name COLLATE NOCASE IN ('PhonePe', 'Paytm') AND (is_preset <> 1 OR is_archived <> 0);
--> statement-breakpoint
UPDATE payment_methods
SET is_archived = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE name COLLATE NOCASE NOT IN ('PhonePe', 'Paytm') AND is_archived <> 1;

--> statement-breakpoint
-- Backfill existing entries from their creation time without changing IDs or other fields.
-- These leaf tables can be rebuilt with D1 foreign-key enforcement enabled.
--> statement-breakpoint
CREATE TABLE `__new_received_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`payment_method_id` integer,
	`amount` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "received_entries_positive" CHECK("__new_received_entries"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_received_entries` (`id`, `user_id`, `entry_date`, `payment_method_id`, `amount`, `note`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `entry_date`, `payment_method_id`, `amount`, `note`, `created_at`, `created_at` FROM `received_entries`;
--> statement-breakpoint
-- Preserve AUTOINCREMENT even when the highest original IDs have been deleted.
INSERT INTO sqlite_sequence (name, seq)
SELECT '__new_received_entries', seq FROM sqlite_sequence
WHERE name = 'received_entries'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = '__new_received_entries');
--> statement-breakpoint
UPDATE sqlite_sequence
SET seq = MAX(seq, COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'received_entries'), 0))
WHERE name = '__new_received_entries';
--> statement-breakpoint
DROP TABLE `received_entries`;
--> statement-breakpoint
ALTER TABLE `__new_received_entries` RENAME TO `received_entries`;
--> statement-breakpoint
CREATE INDEX `received_entries_user_method_idx` ON `received_entries` (`user_id`,`entry_date`,`payment_method_id`,`id`);
--> statement-breakpoint
CREATE TABLE `__new_vendor_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`vendor_name` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "vendor_payments_positive" CHECK("__new_vendor_payments"."amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_vendor_payments` (`id`, `user_id`, `entry_date`, `vendor_name`, `amount`, `note`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `entry_date`, `vendor_name`, `amount`, `note`, `created_at`, `created_at` FROM `vendor_payments`;
--> statement-breakpoint
-- Preserve AUTOINCREMENT even when the highest original IDs have been deleted.
INSERT INTO sqlite_sequence (name, seq)
SELECT '__new_vendor_payments', seq FROM sqlite_sequence
WHERE name = 'vendor_payments'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = '__new_vendor_payments');
--> statement-breakpoint
UPDATE sqlite_sequence
SET seq = MAX(seq, COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'vendor_payments'), 0))
WHERE name = '__new_vendor_payments';
--> statement-breakpoint
DROP TABLE `vendor_payments`;
--> statement-breakpoint
ALTER TABLE `__new_vendor_payments` RENAME TO `vendor_payments`;
--> statement-breakpoint
CREATE INDEX `vendor_payments_user_date_idx` ON `vendor_payments` (`user_id`,`entry_date`,`id`);
