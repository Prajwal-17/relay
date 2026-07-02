PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`customer_type` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "name", "contact", "customer_type", "created_at", "updated_at") SELECT "id", "name", "contact", "customer_type", "created_at", "updated_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
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
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimate_items`("id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "estimate_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `estimate_items`;--> statement-breakpoint
DROP TABLE `estimate_items`;--> statement-breakpoint
ALTER TABLE `__new_estimate_items` RENAME TO `estimate_items`;--> statement-breakpoint
CREATE TABLE `__new_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_no` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimates`("id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `estimates`;--> statement-breakpoint
DROP TABLE `estimates`;--> statement-breakpoint
ALTER TABLE `__new_estimates` RENAME TO `estimates`;--> statement-breakpoint
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
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_product_history`("id", "name", "weight", "unit", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", "created_at", "updated_at") SELECT "id", "name", "weight", "unit", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", NULL, NULL FROM `product_history`;--> statement-breakpoint
DROP TABLE `product_history`;--> statement-breakpoint
ALTER TABLE `__new_product_history` RENAME TO `product_history`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`weight` text,
	`unit` text,
	`mrp` integer,
	`price` integer NOT NULL,
	`total_quantity_sold` integer DEFAULT 0,
	`is_disabled` integer DEFAULT false NOT NULL,
	`disabled_at` text DEFAULT (datetime('now')),
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text DEFAULT (datetime('now')),
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "weight", "unit", "mrp", "price", "total_quantity_sold", "is_disabled", "disabled_at", "is_deleted", "deleted_at", "created_at", "updated_at") SELECT "id", "name", "weight", "unit", "mrp", "price", "total_quantity_sold", "is_disabled", "disabled_at", "is_deleted", "deleted_at", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
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
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", "mrp", "price", "weight", "unit", "quantity", "total_price", "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "invoice_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "invoice_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "role", "password", "created_at", "updated_at") SELECT "id", "name", "role", "password", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;