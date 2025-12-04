PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_draft_items` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_id` text NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`product_snapshot` text NOT NULL,
	`mrp` integer,
	`price` integer,
	`purchase_price` integer,
	`weight` text,
	`unit` text,
	`quantity` integer,
	`total_price` integer,
	`checked_qty` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`draft_id`) REFERENCES `drafts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_draft_items`("id", "draft_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at") SELECT "id", "draft_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at" FROM `draft_items`;--> statement-breakpoint
DROP TABLE `draft_items`;--> statement-breakpoint
ALTER TABLE `__new_draft_items` RENAME TO `draft_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_estimate_items` (
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
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimate_items`("id", "estimate_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at") SELECT "id", "estimate_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at" FROM `estimate_items`;--> statement-breakpoint
DROP TABLE `estimate_items`;--> statement-breakpoint
ALTER TABLE `__new_estimate_items` RENAME TO `estimate_items`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`product_snapshot` text NOT NULL,
	`weight` text,
	`unit` text,
	`mrp` integer,
	`price` integer NOT NULL,
	`purchase_price` integer,
	`total_quantity_sold` integer DEFAULT 0,
	`is_disabled` integer DEFAULT false NOT NULL,
	`disabled_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "product_snapshot", "weight", "unit", "mrp", "price", "purchase_price", "total_quantity_sold", "is_disabled", "disabled_at", "is_deleted", "deleted_at", "created_at", "updated_at") SELECT "id", "name", "product_snapshot", "weight", "unit", "mrp", "price", "purchase_price", "total_quantity_sold", "is_disabled", "disabled_at", "is_deleted", "deleted_at", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
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
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at") SELECT "id", "sale_id", "product_id", "name", "product_snapshot", "mrp", "price", "purchase_price", "weight", "unit", "quantity", "total_price", "checked_qty", "created_at", "updated_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;