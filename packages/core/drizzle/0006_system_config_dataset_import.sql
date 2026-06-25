CREATE TABLE IF NOT EXISTS `system_config` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `model_config` (
  `id` text PRIMARY KEY NOT NULL,
  `provider` text NOT NULL,
  `model` text NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `alert_rules` (
  `id` text PRIMARY KEY NOT NULL,
  `metric` text NOT NULL,
  `operator` text NOT NULL,
  `threshold` real NOT NULL,
  `severity` text DEFAULT 'medium' NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
