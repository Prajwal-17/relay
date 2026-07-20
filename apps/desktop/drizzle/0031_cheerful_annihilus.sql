ALTER TABLE `customers` ADD `is_archived` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `archived_at` text;