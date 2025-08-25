PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "invoice_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "invoice_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
PRAGMA foreign_keys=ON;