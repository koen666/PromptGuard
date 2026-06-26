import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
  activeVersionId: text("active_version_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const promptVersions = sqliteTable("prompt_versions", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  changelog: text("changelog").default(""),
  status: text("status", {
    enum: [
      "draft",
      "versioned",
      "evaluated",
      "security_checked",
      "review_pending",
      "approved",
      "gray",
      "active",
      "rejected",
      "rolled_back",
    ],
  }).notNull().default("versioned"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const promptTags = sqliteTable("prompt_tags", {
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  status: text("status", { enum: ["active", "locked"] }).notNull().default("active"),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name", { enum: ["admin", "engineer", "reviewer", "release_manager", "viewer"] }).notNull().unique(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const userRoles = sqliteTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
});

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const modelConfig = sqliteTable("model_config", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["mock", "openai", "anthropic", "ollama"] }).notNull(),
  model: text("model").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const alertRules = sqliteTable("alert_rules", {
  id: text("id").primaryKey(),
  metric: text("metric").notNull(),
  operator: text("operator", { enum: [">", ">=", "<", "<="] }).notNull(),
  threshold: real("threshold").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const alertRecords = sqliteTable("alert_records", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  releaseId: text("release_id"),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  threshold: real("threshold").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
  status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const metricSamples = sqliteTable("metric_samples", {
  id: text("id").primaryKey(),
  releaseId: text("release_id"),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  environment: text("environment").notNull().default("production"),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  unit: text("unit").default(""),
  sampledAt: text("sampled_at").notNull().default(sql`(datetime('now'))`),
});

export const datasets = sqliteTable("datasets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const testCases = sqliteTable("test_cases", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id").notNull().references(() => datasets.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  expectedBehavior: text("expected_behavior").default(""),
  tags: text("tags").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const evaluationRuns = sqliteTable("evaluation_runs", {
  id: text("id").primaryKey(),
  promptVersionId: text("prompt_version_id").notNull().references(() => promptVersions.id),
  datasetId: text("dataset_id").notNull().references(() => datasets.id),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  models: text("models").notNull(),
  provider: text("provider").notNull().default("mock"),
  avgScore: real("avg_score"),
  totalTokens: integer("total_tokens").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const evaluationResults = sqliteTable("evaluation_results", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().references(() => evaluationRuns.id, { onDelete: "cascade" }),
  testCaseId: text("test_case_id").notNull().references(() => testCases.id),
  model: text("model").notNull(),
  output: text("output").notNull(),
  relevanceScore: real("relevance_score").notNull(),
  formatScore: real("format_score").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  tokenCount: integer("token_count").notNull().default(0),
  cost: real("cost").notNull().default(0),
  errorMessage: text("error_message"),
  passed: integer("passed", { mode: "boolean" }).notNull().default(false),
});

export const evaluationComparisons = sqliteTable("evaluation_comparisons", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  baselineVersionId: text("baseline_version_id").notNull().references(() => promptVersions.id),
  candidateVersionId: text("candidate_version_id").notNull().references(() => promptVersions.id),
  datasetId: text("dataset_id").notNull().references(() => datasets.id),
  baselineRunId: text("baseline_run_id").notNull().references(() => evaluationRuns.id),
  candidateRunId: text("candidate_run_id").notNull().references(() => evaluationRuns.id),
  avgScoreDelta: real("avg_score_delta").notNull(),
  passRateDelta: real("pass_rate_delta").notNull(),
  latencyDeltaMs: real("latency_delta_ms").notNull(),
  improvedCount: integer("improved_count").notNull(),
  regressedCount: integer("regressed_count").notNull(),
  unchangedCount: integer("unchanged_count").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const securityScans = sqliteTable("security_scans", {
  id: text("id").primaryKey(),
  promptVersionId: text("prompt_version_id").notNull().references(() => promptVersions.id),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  provider: text("provider").notNull().default("mock"),
  riskScore: real("risk_score"),
  passed: integer("passed", { mode: "boolean" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const securityFindings = sqliteTable("security_findings", {
  id: text("id").primaryKey(),
  scanId: text("scan_id").notNull().references(() => securityScans.id, { onDelete: "cascade" }),
  testName: text("test_name").notNull(),
  attackInput: text("attack_input").notNull(),
  modelOutput: text("model_output").notNull(),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation").default(""),
  passed: integer("passed", { mode: "boolean" }).notNull(),
});

export const reviewRequests = sqliteTable("review_requests", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: text("prompt_version_id").notNull().references(() => promptVersions.id),
  evaluationRunId: text("evaluation_run_id").references(() => evaluationRuns.id),
  securityScanId: text("security_scan_id").references(() => securityScans.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submittedBy: text("submitted_by").default("engineer"),
  reviewedBy: text("reviewed_by"),
  comment: text("comment").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  reviewedAt: text("reviewed_at"),
});

export const grayReleases = sqliteTable("gray_releases", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: text("prompt_version_id").notNull().references(() => promptVersions.id),
  trafficPercent: integer("traffic_percent").notNull(),
  status: text("status", { enum: ["active", "completed", "rolled_back"] }).notNull().default("active"),
  note: text("note").default(""),
  observationScore: real("observation_score"),
  observationLatencyMs: integer("observation_latency_ms"),
  observationCost: real("observation_cost"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  endedAt: text("ended_at"),
});

export const routePolicies = sqliteTable("route_policies", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  environment: text("environment").notNull().default("production"),
  stableVersionId: text("stable_version_id").references(() => promptVersions.id),
  grayVersionId: text("gray_version_id").references(() => promptVersions.id),
  trafficPercent: integer("traffic_percent").notNull().default(0),
  status: text("status", { enum: ["idle", "gray", "full", "rolled_back"] }).notNull().default("idle"),
  updatedBy: text("updated_by").default("system"),
  note: text("note").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const releaseEvents = sqliteTable("release_events", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: text("prompt_version_id").references(() => promptVersions.id),
  eventType: text("event_type", {
    enum: ["gray_start", "gray_expand", "full_release", "rollback"],
  }).notNull(),
  detail: text("detail").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actor: text("actor").default("system"),
  detail: text("detail").default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const reportRecords = sqliteTable("report_records", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["evaluation", "diff", "security", "release", "audit"] }).notNull(),
  sourceId: text("source_id").notNull(),
  format: text("format", { enum: ["json", "html"] }).notNull(),
  filePath: text("file_path").notNull(),
  generatedBy: text("generated_by").default("system"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const promptsRelations = relations(prompts, ({ many, one }) => ({
  versions: many(promptVersions),
  tags: many(promptTags),
  activeVersion: one(promptVersions, {
    fields: [prompts.activeVersionId],
    references: [promptVersions.id],
  }),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one, many }) => ({
  prompt: one(prompts, { fields: [promptVersions.promptId], references: [prompts.id] }),
  evaluationRuns: many(evaluationRuns),
  securityScans: many(securityScans),
}));

export const routePoliciesRelations = relations(routePolicies, ({ one }) => ({
  prompt: one(prompts, { fields: [routePolicies.promptId], references: [prompts.id] }),
  stableVersion: one(promptVersions, {
    fields: [routePolicies.stableVersionId],
    references: [promptVersions.id],
  }),
  grayVersion: one(promptVersions, {
    fields: [routePolicies.grayVersionId],
    references: [promptVersions.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  sessions: many(sessions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const datasetsRelations = relations(datasets, ({ many }) => ({
  testCases: many(testCases),
}));

export const evaluationRunsRelations = relations(evaluationRuns, ({ one, many }) => ({
  promptVersion: one(promptVersions, { fields: [evaluationRuns.promptVersionId], references: [promptVersions.id] }),
  dataset: one(datasets, { fields: [evaluationRuns.datasetId], references: [datasets.id] }),
  results: many(evaluationResults),
}));

export const evaluationComparisonsRelations = relations(evaluationComparisons, ({ one }) => ({
  prompt: one(prompts, { fields: [evaluationComparisons.promptId], references: [prompts.id] }),
  baselineVersion: one(promptVersions, {
    fields: [evaluationComparisons.baselineVersionId],
    references: [promptVersions.id],
  }),
  candidateVersion: one(promptVersions, {
    fields: [evaluationComparisons.candidateVersionId],
    references: [promptVersions.id],
  }),
  baselineRun: one(evaluationRuns, {
    fields: [evaluationComparisons.baselineRunId],
    references: [evaluationRuns.id],
  }),
  candidateRun: one(evaluationRuns, {
    fields: [evaluationComparisons.candidateRunId],
    references: [evaluationRuns.id],
  }),
}));

export const securityScansRelations = relations(securityScans, ({ one, many }) => ({
  promptVersion: one(promptVersions, { fields: [securityScans.promptVersionId], references: [promptVersions.id] }),
  findings: many(securityFindings),
}));
