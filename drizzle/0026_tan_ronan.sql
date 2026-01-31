PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` integer,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimates`("id", "estimate_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "estimate_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `estimates`;--> statement-breakpoint
DROP TABLE `estimates`;--> statement-breakpoint
ALTER TABLE `__new_estimates` RENAME TO `estimates`;--> statement-breakpoint
CREATE UNIQUE INDEX `estimates_estimate_no_unique` ON `estimates` (`estimate_no`);--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` integer NOT NULL,
	`customer_id` text NOT NULL,
	`grand_total` integer,
	`total_quantity` integer,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "invoice_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "invoice_no", "customer_id", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_no_unique` ON `sales` (`invoice_no`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
