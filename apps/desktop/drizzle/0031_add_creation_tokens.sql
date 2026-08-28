ALTER TABLE `estimates` ADD `creation_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `estimates_creation_token_unique` ON `estimates` (`creation_token`);--> statement-breakpoint
ALTER TABLE `sales` ADD `creation_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_creation_token_unique` ON `sales` (`creation_token`);