ALTER TABLE `review_requests` ADD `evaluation_run_id` text REFERENCES `evaluation_runs`(`id`);
--> statement-breakpoint
ALTER TABLE `review_requests` ADD `security_scan_id` text REFERENCES `security_scans`(`id`);
