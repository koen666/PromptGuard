CREATE TABLE IF NOT EXISTS `alert_records` (
  `id` text PRIMARY KEY NOT NULL,
  `rule_id` text,
  `release_id` text,
  `metric` text NOT NULL,
  `value` real NOT NULL,
  `threshold` real NOT NULL,
  `severity` text NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `message` text NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`rule_id`) REFERENCES `alert_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `metric_samples` (
  `id` text PRIMARY KEY NOT NULL,
  `release_id` text,
  `prompt_id` text NOT NULL,
  `environment` text DEFAULT 'production' NOT NULL,
  `metric` text NOT NULL,
  `value` real NOT NULL,
  `unit` text DEFAULT '',
  `sampled_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `report_records` (
  `id` text PRIMARY KEY NOT NULL,
  `type` text NOT NULL,
  `source_id` text NOT NULL,
  `format` text NOT NULL,
  `file_path` text NOT NULL,
  `generated_by` text DEFAULT 'system',
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
