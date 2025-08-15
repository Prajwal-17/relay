ALTER TABLE `estimate` RENAME TO `estimates`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_no` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimates`("id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `estimates`;--> statement-breakpoint
DROP TABLE `estimates`;--> statement-breakpoint
ALTER TABLE `__new_estimates` RENAME TO `estimates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimate_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimate_items`("id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `estimate_items`;--> statement-breakpoint
DROP TABLE `estimate_items`;--> statement-breakpoint
ALTER TABLE `__new_estimate_items` RENAME TO `estimate_items`;