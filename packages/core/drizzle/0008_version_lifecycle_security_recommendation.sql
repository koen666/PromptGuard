ALTER TABLE `prompt_versions` ADD `status` text DEFAULT 'versioned' NOT NULL;--> statement-breakpoint
ALTER TABLE `security_findings` ADD `recommendation` text DEFAULT '';
