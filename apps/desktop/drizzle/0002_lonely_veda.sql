PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`customer_type` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "name", "contact", "customer_type", "created_at", "updated_at") SELECT "id", "name", "contact", "customer_type", "created_at", "updated_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weight` text,
	`unit` text,
	`mrp` real,
	`price` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "weight", "unit", "mrp", "price", "created_at", "updated_at") SELECT "id", "name", NULL, NULL, "mrp", "price", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`mrp` real,
	`price` real NOT NULL,
	`weight` text,
	`unit` text,
	`quantity` real NOT NULL,
	`total_price` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", NULL, "price", NULL, NULL, "quantity", NULL, "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`grandTotal` real NOT NULL,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "customer_id", "customer_name", "grandTotal", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "customer_id", "customer_name", "total", "total_quantity", 1, "created_at", "updated_at" FROM `sales`;
--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
ALTER TABLE `product_history` ADD `weight` text;--> statement-breakpoint
ALTER TABLE `product_history` ADD `unit` text;--> statement-breakpoint
ALTER TABLE `product_history` DROP COLUMN `quantity`;
