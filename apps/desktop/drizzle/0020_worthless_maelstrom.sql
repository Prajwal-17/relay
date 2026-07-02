PRAGMA foreign_keys=OFF;--> statement-breakpoint

CREATE TABLE `__new_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

INSERT INTO `__new_estimates`("id", "estimate_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") 
SELECT "id", "estimate_no", "customer_id", "grand_total", "total_quantity", "is_paid", 
       COALESCE("created_at", datetime('now')), 
       COALESCE("updated_at", datetime('now')) 
FROM `estimates`;--> statement-breakpoint

INSERT INTO `__new_sales`("id", "invoice_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") 
SELECT "id", "invoice_no", "customer_id", "grand_total", "total_quantity", "is_paid", 
       COALESCE("created_at", datetime('now')), 
       COALESCE("updated_at", datetime('now')) 
FROM `sales`;--> statement-breakpoint

CREATE TABLE `__new_estimate_items` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `__new_estimates`(`id`) ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);--> statement-breakpoint

CREATE TABLE `__new_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `__new_sales`(`id`) ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);--> statement-breakpoint

INSERT INTO `__new_estimate_items` 
SELECT "id", "estimate_id", "product_id", "name", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price",
       COALESCE("created_at", datetime('now')), 
       COALESCE("updated_at", datetime('now'))
FROM `estimate_items`;--> statement-breakpoint

INSERT INTO `__new_sale_items` 
SELECT "id", "sale_id", "product_id", "name", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price",
       COALESCE("created_at", datetime('now')), 
       COALESCE("updated_at", datetime('now'))
FROM `sale_items`;--> statement-breakpoint

DROP TABLE `estimate_items`;--> statement-breakpoint

DROP TABLE `sale_items`;--> statement-breakpoint

DROP TABLE `estimates`;--> statement-breakpoint

DROP TABLE `sales`;--> statement-breakpoint

ALTER TABLE `__new_estimates` RENAME TO `estimates`;--> statement-breakpoint

ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint

ALTER TABLE `__new_estimate_items` RENAME TO `estimate_items`;--> statement-breakpoint

ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint

CREATE UNIQUE INDEX `estimates_estimate_no_unique` ON `estimates` (`estimate_no`);--> statement-breakpoint

CREATE UNIQUE INDEX `sales_invoice_no_unique` ON `sales` (`invoice_no`);--> statement-breakpoint

PRAGMA foreign_keys=ON;