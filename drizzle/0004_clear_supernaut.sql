PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` real NOT NULL,
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
INSERT INTO `__new_sales`("id", "invoice_number", "customer_id", "customer_name", "grandTotal", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "invoice_number", "customer_id", "customer_name", "grandTotal", "total_quantity", "is_paid", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_number_unique` ON `sales` (`invoice_number`);