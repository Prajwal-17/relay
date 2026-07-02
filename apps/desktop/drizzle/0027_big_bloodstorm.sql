CREATE TABLE IF NOT EXISTS `app_instance` (
	`id` text PRIMARY KEY NOT NULL,
	`os` text,
	`installed_at` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`store_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`address_line1` text NOT NULL,
	`address_line2` text,
	`country` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`city` text NOT NULL,
	`gstin` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
