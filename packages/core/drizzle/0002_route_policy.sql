CREATE TABLE IF NOT EXISTS `route_policies` (
  `id` text PRIMARY KEY NOT NULL,
  `prompt_id` text NOT NULL,
  `environment` text DEFAULT 'production' NOT NULL,
  `stable_version_id` text,
  `gray_version_id` text,
  `traffic_percent` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'idle' NOT NULL,
  `updated_by` text DEFAULT 'system',
  `note` text DEFAULT '',
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`stable_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`gray_version_id`) REFERENCES `prompt_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `route_policies_prompt_environment_unique` ON `route_policies` (`prompt_id`, `environment`);
