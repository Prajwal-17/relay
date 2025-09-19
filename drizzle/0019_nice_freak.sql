CREATE UNIQUE INDEX `customers_name_unique` ON `customers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_contact_unique` ON `customers` (`contact`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_name_contact_unique` ON `customers` (`name`,`contact`);--> statement-breakpoint
ALTER TABLE `estimates` DROP COLUMN `customer_name`;--> statement-breakpoint
ALTER TABLE `estimates` DROP COLUMN `customer_contact`;--> statement-breakpoint
ALTER TABLE `sales` DROP COLUMN `customer_name`;--> statement-breakpoint
ALTER TABLE `sales` DROP COLUMN `customer_contact`;