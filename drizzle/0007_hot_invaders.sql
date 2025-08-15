CREATE TABLE `estimate` (
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
CREATE TABLE `estimate_items` (
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
	FOREIGN KEY (`estimate_id`) REFERENCES `estimate`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product_history` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weight` text,
	`unit` text,
	`product_id` text NOT NULL,
	`old_price` integer,
	`new_price` integer,
	`old_mrp` integer,
	`new_mrp` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_product_history`("id", "name", "weight", "unit", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", "created_at") SELECT "id", "name", "weight", "unit", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", "created_at" FROM `product_history`;--> statement-breakpoint
DROP TABLE `product_history`;--> statement-breakpoint
ALTER TABLE `__new_product_history` RENAME TO `product_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weight` text,
	`unit` text,
	`mrp` integer,
	`price` integer NOT NULL,
	`total_quantity_sold` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "weight", "unit", "mrp", "price", "total_quantity_sold", "created_at", "updated_at") SELECT "id", "name", "weight", "unit", "mrp", "price", NULL, "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
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
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;
