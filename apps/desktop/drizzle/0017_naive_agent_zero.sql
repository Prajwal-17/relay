ALTER TABLE `estimate_items` ADD `purchase_price` integer;--> statement-breakpoint
ALTER TABLE `product_history` ADD `old_purchase_price` integer;--> statement-breakpoint
ALTER TABLE `product_history` ADD `new_purchase_price` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `purchase_price` integer;--> statement-breakpoint
ALTER TABLE `sale_items` ADD `purchase_price` integer;