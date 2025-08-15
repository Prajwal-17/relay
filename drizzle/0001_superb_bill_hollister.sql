PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`customer_type` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "name", "contact", "customer_type", "created_at", "updated_at") SELECT "id", "name", "contact", "customer_type", "created_at", "updated_at" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_product_history` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` real,
	`product_id` text NOT NULL,
	`old_price` real,
	`new_price` real,
	`old_mrp` real,
	`new_mrp` real,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_product_history`("id", "name", "quantity", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", "created_at") SELECT "id", "name", "quantity", "product_id", "old_price", "new_price", "old_mrp", "new_mrp", "created_at" FROM `product_history`;--> statement-breakpoint
DROP TABLE `product_history`;--> statement-breakpoint
ALTER TABLE `__new_product_history` RENAME TO `product_history`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` real NOT NULL,
	`mrp` real NOT NULL,
	`price` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "quantity", "mrp", "price", "created_at", "updated_at") SELECT "id", "name", "quantity", "mrp", "price", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`price` real NOT NULL,
	`quantity` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "price", "quantity", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", "price", "quantity", "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`total` real NOT NULL,
	`total_quantity` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "customer_id", "customer_name", "total", "total_quantity", "created_at", "updated_at") SELECT "id", "customer_id", "customer_name", "total", "total_quantity", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "role", "password", "created_at", "updated_at") SELECT "id", "name", "role", "password", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;
