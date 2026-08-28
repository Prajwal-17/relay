ALTER TABLE `customers` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `customers` ADD `address` text;
--> statement-breakpoint
ALTER TABLE `customers` ADD `outstanding_balance` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `customers` ADD `is_archived` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `customers` ADD `archived_at` text;
--> statement-breakpoint
ALTER TABLE `sale_items` RENAME TO `__0030_sale_items`;
--> statement-breakpoint
ALTER TABLE `estimate_items` RENAME TO `__0030_estimate_items`;
--> statement-breakpoint
ALTER TABLE `sales` RENAME TO `__0030_sales`;
--> statement-breakpoint
ALTER TABLE `estimates` RENAME TO `__0030_estimates`;
--> statement-breakpoint
DROP INDEX `sale_items_id_idx`;
--> statement-breakpoint
DROP INDEX `sale_items_sale_id_idx`;
--> statement-breakpoint
DROP INDEX `sale_items_product_id_idx`;
--> statement-breakpoint
DROP INDEX `estimate_items_id_idx`;
--> statement-breakpoint
DROP INDEX `estimate_items_estimate_id_idx`;
--> statement-breakpoint
DROP INDEX `estimate_items_product_id_idx`;
--> statement-breakpoint
DROP INDEX `sales_invoice_no_unique`;
--> statement-breakpoint
DROP INDEX `sales_id_idx`;
--> statement-breakpoint
DROP INDEX `sales_customer_id_idx`;
--> statement-breakpoint
DROP INDEX `estimates_estimate_no_unique`;
--> statement-breakpoint
DROP INDEX `estimates_id_idx`;
--> statement-breakpoint
DROP INDEX `estimates_customer_id_idx`;
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`invoice_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` integer,
	`notes` text,
	`recorded_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `store_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `sales` (
	`id`, `store_id`, `invoice_no`, `customer_id`, `grand_total`, `total_quantity`,
	`notes`, `recorded_at`, `created_at`, `updated_at`
)
SELECT
	`id`, `store_id`, `invoice_no`, `customer_id`, `grand_total`, `total_quantity`,
	NULL, `created_at`, `created_at`, `updated_at`
FROM `__0030_sales`;
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_no_unique` ON `sales` (`invoice_no`);
--> statement-breakpoint
CREATE INDEX `sales_id_idx` ON `sales` (`id`);
--> statement-breakpoint
CREATE INDEX `sales_customer_id_idx` ON `sales` (`customer_id`);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`estimate_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` integer,
	`notes` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `store_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `estimates` (
	`id`, `store_id`, `estimate_no`, `customer_id`, `grand_total`, `total_quantity`,
	`notes`, `created_at`, `updated_at`
)
SELECT
	`id`, `store_id`, `estimate_no`, `customer_id`, `grand_total`, `total_quantity`,
	NULL, `created_at`, `updated_at`
FROM `__0030_estimates`;
--> statement-breakpoint
CREATE UNIQUE INDEX `estimates_estimate_no_unique` ON `estimates` (`estimate_no`);
--> statement-breakpoint
CREATE INDEX `estimates_id_idx` ON `estimates` (`id`);
--> statement-breakpoint
CREATE INDEX `estimates_customer_id_idx` ON `estimates` (`customer_id`);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`product_snapshot` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`checked_qty` integer DEFAULT 0,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `sale_items` (
	`id`, `sale_id`, `product_id`, `name`, `product_snapshot`, `mrp`, `price`,
	`purchase_price`, `weight`, `unit`, `quantity`, `total_price`, `checked_qty`,
	`position`, `created_at`, `updated_at`
)
SELECT
	`id`, `sale_id`, `product_id`, `name`, `product_snapshot`, `mrp`, `price`,
	`purchase_price`, `weight`, `unit`, `quantity`, `total_price`, `checked_qty`,
	(ROW_NUMBER() OVER (PARTITION BY `sale_id` ORDER BY `created_at`, `id`) - 1) * 65536,
	`created_at`, `updated_at`
FROM `__0030_sale_items`;
--> statement-breakpoint
CREATE INDEX `sale_items_id_idx` ON `sale_items` (`id`);
--> statement-breakpoint
CREATE INDEX `sale_items_sale_id_idx` ON `sale_items` (`sale_id`);
--> statement-breakpoint
CREATE INDEX `sale_items_product_id_idx` ON `sale_items` (`product_id`);
--> statement-breakpoint
CREATE INDEX `sale_items_position_idx` ON `sale_items` (`sale_id`,`position`);
--> statement-breakpoint
CREATE TABLE `estimate_items` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`product_snapshot` text NOT NULL,
	`mrp` integer,
	`price` integer NOT NULL,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer NOT NULL,
	`total_price` integer NOT NULL,
	`checked_qty` integer DEFAULT 0,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `estimate_items` (
	`id`, `estimate_id`, `product_id`, `name`, `product_snapshot`, `mrp`, `price`,
	`purchase_price`, `weight`, `unit`, `quantity`, `total_price`, `checked_qty`,
	`position`, `created_at`, `updated_at`
)
SELECT
	`id`, `estimate_id`, `product_id`, `name`, `product_snapshot`, `mrp`, `price`,
	`purchase_price`, `weight`, `unit`, `quantity`, `total_price`, `checked_qty`,
	(ROW_NUMBER() OVER (PARTITION BY `estimate_id` ORDER BY `created_at`, `id`) - 1) * 65536,
	`created_at`, `updated_at`
FROM `__0030_estimate_items`;
--> statement-breakpoint
CREATE INDEX `estimate_items_id_idx` ON `estimate_items` (`id`);
--> statement-breakpoint
CREATE INDEX `estimate_items_estimate_id_idx` ON `estimate_items` (`estimate_id`);
--> statement-breakpoint
CREATE INDEX `estimate_items_product_id_idx` ON `estimate_items` (`product_id`);
--> statement-breakpoint
CREATE INDEX `estimate_items_position_idx` ON `estimate_items` (`estimate_id`,`position`);
--> statement-breakpoint
DROP TABLE `__0030_sale_items`;
--> statement-breakpoint
DROP TABLE `__0030_estimate_items`;
--> statement-breakpoint
DROP TABLE `__0030_sales`;
--> statement-breakpoint
DROP TABLE `__0030_estimates`;
--> statement-breakpoint
CREATE TABLE `customer_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`store_id` text,
	`type` text NOT NULL,
	`sale_id` text,
	`amount_due` integer DEFAULT 0,
	`amount_paid` integer DEFAULT 0,
	`payment_mode` text,
	`notes` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `store_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_ledger_sale_id_unique` ON `customer_ledger` (`sale_id`);
--> statement-breakpoint
CREATE TABLE `app_data_migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`applied_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS `products_fts`;
--> statement-breakpoint
DROP TABLE IF EXISTS `products_fts_data`;
--> statement-breakpoint
DROP TABLE IF EXISTS `products_fts_idx`;
--> statement-breakpoint
DROP TABLE IF EXISTS `products_fts_docsize`;
--> statement-breakpoint
DROP TABLE IF EXISTS `products_fts_config`;
