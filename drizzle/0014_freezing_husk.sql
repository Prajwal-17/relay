PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_no` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_contact` text,
	`grand_total` integer,
	`total_quantity` real,
	`is_paid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_estimates`("id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at") SELECT "id", "estimate_no", "customer_id", "customer_name", "customer_contact", "grand_total", "total_quantity", "is_paid", "created_at", "updated_at" FROM `estimates`;--> statement-breakpoint
DROP TABLE `estimates`;--> statement-breakpoint
ALTER TABLE `__new_estimates` RENAME TO `estimates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;