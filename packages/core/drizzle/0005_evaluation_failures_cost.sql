ALTER TABLE `evaluation_runs` ADD `total_tokens` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `evaluation_runs` ADD `total_cost` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `evaluation_runs` ADD `error_message` text;
--> statement-breakpoint
ALTER TABLE `evaluation_results` ADD `token_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `evaluation_results` ADD `cost` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `evaluation_results` ADD `error_message` text;
