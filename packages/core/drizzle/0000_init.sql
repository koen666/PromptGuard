CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`status` text DEFAULT 'draft' NOT NULL,
	`active_version_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompt_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`changelog` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);
--> statement-breakpoint
CREATE TABLE `prompt_tags` (
	`prompt_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`dataset_id` text NOT NULL,
	`input` text NOT NULL,
	`expected_behavior` text DEFAULT '',
	`tags` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `evaluation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_version_id` text NOT NULL,
	`dataset_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`models` text NOT NULL,
	`provider` text DEFAULT 'mock' NOT NULL,
	`avg_score` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluation_results` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`test_case_id` text NOT NULL,
	`model` text NOT NULL,
	`output` text NOT NULL,
	`relevance_score` real NOT NULL,
	`format_score` real NOT NULL,
	`latency_ms` integer NOT NULL,
	`passed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `evaluation_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`test_case_id`) REFERENCES `test_cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `security_scans` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_version_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text DEFAULT 'mock' NOT NULL,
	`risk_score` real,
	`passed` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `security_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`scan_id` text NOT NULL,
	`test_name` text NOT NULL,
	`attack_input` text NOT NULL,
	`model_output` text NOT NULL,
	`risk_level` text NOT NULL,
	`description` text NOT NULL,
	`passed` integer NOT NULL,
	FOREIGN KEY (`scan_id`) REFERENCES `security_scans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`prompt_version_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by` text DEFAULT 'engineer',
	`reviewed_by` text,
	`comment` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gray_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`prompt_version_id` text NOT NULL,
	`traffic_percent` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`note` text DEFAULT '',
	`observation_score` real,
	`observation_latency_ms` integer,
	`observation_cost` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `release_events` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`prompt_version_id` text,
	`event_type` text NOT NULL,
	`detail` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`actor` text DEFAULT 'system',
	`detail` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
