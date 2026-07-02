ALTER TABLE `sales` ADD `invoice_number` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_number_unique` ON `sales` (`invoice_number`);