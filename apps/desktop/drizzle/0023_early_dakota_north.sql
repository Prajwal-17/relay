CREATE TABLE `draft_items` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`product_snapshot` text DEFAULT '',
	`mrp` integer,
	`price` integer,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer,
	`total_price` integer,
	`checked_qty` integer DEFAULT 0,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`draft_id`) REFERENCES `drafts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`invoice_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` real,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `drafts_invoice_no_unique` ON `drafts` (`invoice_no`);--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `estimate_items` ADD `product_snapshot` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `product_snapshot` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_items` ADD `product_snapshot` text DEFAULT '' NOT NULL;