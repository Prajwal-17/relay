PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_estimate_items` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimate_items`("id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `estimate_items`;--> statement-breakpoint
DROP TABLE `estimate_items`;--> statement-breakpoint
ALTER TABLE `__new_estimate_items` RENAME TO `estimate_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;