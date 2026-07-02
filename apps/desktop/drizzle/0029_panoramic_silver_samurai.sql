CREATE TABLE `app_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text,
	`config` text NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `store_profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `store_id` text REFERENCES store_profile(id);--> statement-breakpoint
CREATE INDEX `customer_store_id_idx` ON `customers` (`store_id`);--> statement-breakpoint
ALTER TABLE `estimates` ADD `store_id` text REFERENCES store_profile(id);--> statement-breakpoint
CREATE INDEX `estimates_id_idx` ON `estimates` (`id`);--> statement-breakpoint
CREATE INDEX `estimates_customer_id_idx` ON `estimates` (`customer_id`);--> statement-breakpoint
ALTER TABLE `products` ADD `store_id` text REFERENCES store_profile(id);--> statement-breakpoint
CREATE INDEX `product_store_id_idx` ON `products` (`store_id`);--> statement-breakpoint
CREATE INDEX `product_snapshot_idx` ON `products` (`product_snapshot`);--> statement-breakpoint
ALTER TABLE `sales` ADD `store_id` text REFERENCES store_profile(id);--> statement-breakpoint
CREATE INDEX `sales_id_idx` ON `sales` (`id`);--> statement-breakpoint
CREATE INDEX `sales_customer_id_idx` ON `sales` (`customer_id`);--> statement-breakpoint
CREATE INDEX `estimate_items_id_idx` ON `estimate_items` (`id`);--> statement-breakpoint
CREATE INDEX `estimate_items_estimate_id_idx` ON `estimate_items` (`estimate_id`);--> statement-breakpoint
CREATE INDEX `estimate_items_product_id_idx` ON `estimate_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `sale_items_id_idx` ON `sale_items` (`id`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_id_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_product_id_idx` ON `sale_items` (`product_id`);