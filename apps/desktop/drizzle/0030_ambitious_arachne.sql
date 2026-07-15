CREATE TABLE `customer_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`store_id` text,
	`type` text NOT NULL,
	`sale_id` text,
	`debit` integer DEFAULT 0,
	`credit` integer DEFAULT 0,
	`payment_mode` text,
	`notes` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `store_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `outstanding_balance` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit_limit` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `estimate_items` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `estimate_items_position_idx` ON `estimate_items` (`estimate_id`,`position`);--> statement-breakpoint
ALTER TABLE `sale_items` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `sale_items_position_idx` ON `sale_items` (`sale_id`,`position`);