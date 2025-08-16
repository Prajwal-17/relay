ALTER TABLE `products` ADD `is_disabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `disabled_at` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `is_deleted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `deleted_at` integer;