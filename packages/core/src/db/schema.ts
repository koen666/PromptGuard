import { relations, sql } from "drizzle-orm";
import { boolean, double, index, int, longtext, mysqlTable, primaryKey, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

const id = (name = "id") => varchar(name, { length: 160 });
const shortText = (name: string, length = 255) => varchar(name, { length });
const statusText = <T extends string>(name: string, values: readonly [T, ...T[]], length = 64) =>
  varchar(name, { length, enum: values });
const timestampText = (name: string) => varchar(name, { length: 40 }).notNull().default(sql`(UTC_TIMESTAMP(3))`);

export const prompts = mysqlTable("prompts", {
  id: id().primaryKey(),
  name: shortText("name").notNull(),
  description: longtext("description").default(""),
  status: statusText("status", ["draft", "active", "archived"]).notNull().default("draft"),
  activeVersionId: id("active_version_id"),
  createdAt: timestampText("created_at"),
  updatedAt: timestampText("updated_at"),
});

export const promptVersions = mysqlTable("prompt_versions", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  versionNumber: int("version_number").notNull(),
  content: longtext("content").notNull(),
  changelog: longtext("changelog").default(""),
  status: statusText("status", [
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
  ]).notNull().default("versioned"),
  createdAt: timestampText("created_at"),
}, (table) => ({
  promptVersionIdx: index("idx_prompt_versions_prompt").on(table.promptId),
}));

export const tags = mysqlTable("tags", {
  id: id().primaryKey(),
  name: shortText("name").notNull().unique(),
});

export const promptTags = mysqlTable("prompt_tags", {
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  tagId: id("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.promptId, table.tagId] }),
  tagIdx: index("idx_prompt_tags_tag").on(table.tagId),
}));

export const users = mysqlTable("users", {
  id: id().primaryKey(),
  username: shortText("username").notNull().unique(),
  passwordHash: shortText("password_hash").notNull(),
  displayName: shortText("display_name").notNull(),
  status: statusText("status", ["active", "locked"]).notNull().default("active"),
  failedLoginCount: int("failed_login_count").notNull().default(0),
  createdAt: timestampText("created_at"),
  updatedAt: timestampText("updated_at"),
});

export const roles = mysqlTable("roles", {
  id: id().primaryKey(),
  name: statusText("name", ["admin", "engineer", "reviewer", "release_manager", "viewer"]).notNull().unique(),
  description: longtext("description").default(""),
  createdAt: timestampText("created_at"),
});

export const userRoles = mysqlTable("user_roles", {
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: id("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  roleIdx: index("idx_user_roles_role").on(table.roleId),
}));

export const sessions = mysqlTable("sessions", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: shortText("token_hash").notNull().unique(),
  createdAt: timestampText("created_at"),
  expiresAt: shortText("expires_at", 40).notNull(),
  revokedAt: shortText("revoked_at", 40),
}, (table) => ({
  userIdx: index("idx_sessions_user").on(table.userId),
}));

export const systemConfig = mysqlTable("system_config", {
  key: shortText("key").primaryKey(),
  value: longtext("value").notNull(),
  updatedAt: timestampText("updated_at"),
});

export const modelConfig = mysqlTable("model_config", {
  id: id().primaryKey(),
  provider: statusText("provider", ["mock", "openai", "anthropic", "ollama"]).notNull(),
  model: shortText("model").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestampText("updated_at"),
}, (table) => ({
  providerIdx: index("idx_model_config_provider").on(table.provider),
}));

export const alertRules = mysqlTable("alert_rules", {
  id: id().primaryKey(),
  metric: shortText("metric").notNull(),
  operator: statusText("operator", [">", ">=", "<", "<="], 4).notNull(),
  threshold: double("threshold").notNull(),
  severity: statusText("severity", ["low", "medium", "high"]).notNull().default("medium"),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestampText("updated_at"),
});

export const alertRecords = mysqlTable("alert_records", {
  id: id().primaryKey(),
  ruleId: id("rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  releaseId: id("release_id"),
  metric: shortText("metric").notNull(),
  value: double("value").notNull(),
  threshold: double("threshold").notNull(),
  severity: statusText("severity", ["low", "medium", "high"]).notNull(),
  status: statusText("status", ["open", "resolved"]).notNull().default("open"),
  message: longtext("message").notNull(),
  createdAt: timestampText("created_at"),
}, (table) => ({
  statusIdx: index("idx_alert_records_status").on(table.status),
}));

export const metricSamples = mysqlTable("metric_samples", {
  id: id().primaryKey(),
  releaseId: id("release_id"),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  environment: shortText("environment").notNull().default("production"),
  metric: shortText("metric").notNull(),
  value: double("value").notNull(),
  unit: shortText("unit").default(""),
  sampledAt: timestampText("sampled_at"),
}, (table) => ({
  releaseIdx: index("idx_metric_samples_release").on(table.releaseId),
  promptIdx: index("idx_metric_samples_prompt").on(table.promptId),
}));

export const datasets = mysqlTable("datasets", {
  id: id().primaryKey(),
  name: shortText("name").notNull(),
  description: longtext("description").default(""),
  createdAt: timestampText("created_at"),
  updatedAt: timestampText("updated_at"),
});

export const testCases = mysqlTable("test_cases", {
  id: id().primaryKey(),
  datasetId: id("dataset_id").notNull().references(() => datasets.id, { onDelete: "cascade" }),
  input: longtext("input").notNull(),
  expectedBehavior: longtext("expected_behavior").default(""),
  tags: longtext("tags").default(""),
  createdAt: timestampText("created_at"),
}, (table) => ({
  datasetIdx: index("idx_test_cases_dataset").on(table.datasetId),
}));

export const evaluationRuns = mysqlTable("evaluation_runs", {
  id: id().primaryKey(),
  promptVersionId: id("prompt_version_id").notNull().references(() => promptVersions.id),
  datasetId: id("dataset_id").notNull().references(() => datasets.id),
  status: statusText("status", ["pending", "running", "completed", "failed"]).notNull().default("pending"),
  models: longtext("models").notNull(),
  provider: shortText("provider").notNull().default("mock"),
  avgScore: double("avg_score"),
  totalTokens: int("total_tokens").notNull().default(0),
  totalCost: double("total_cost").notNull().default(0),
  errorMessage: longtext("error_message"),
  createdAt: timestampText("created_at"),
  completedAt: shortText("completed_at", 40),
}, (table) => ({
  versionIdx: index("idx_evaluation_runs_version").on(table.promptVersionId),
  datasetIdx: index("idx_evaluation_runs_dataset").on(table.datasetId),
}));

export const evaluationResults = mysqlTable("evaluation_results", {
  id: id().primaryKey(),
  runId: id("run_id").notNull().references(() => evaluationRuns.id, { onDelete: "cascade" }),
  testCaseId: id("test_case_id").notNull().references(() => testCases.id),
  model: shortText("model").notNull(),
  output: longtext("output").notNull(),
  relevanceScore: double("relevance_score").notNull(),
  formatScore: double("format_score").notNull(),
  latencyMs: int("latency_ms").notNull(),
  tokenCount: int("token_count").notNull().default(0),
  cost: double("cost").notNull().default(0),
  errorMessage: longtext("error_message"),
  passed: boolean("passed").notNull().default(false),
}, (table) => ({
  runIdx: index("idx_evaluation_results_run").on(table.runId),
  caseIdx: index("idx_evaluation_results_case").on(table.testCaseId),
}));

export const evaluationComparisons = mysqlTable("evaluation_comparisons", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  baselineVersionId: id("baseline_version_id").notNull().references(() => promptVersions.id),
  candidateVersionId: id("candidate_version_id").notNull().references(() => promptVersions.id),
  datasetId: id("dataset_id").notNull().references(() => datasets.id),
  baselineRunId: id("baseline_run_id").notNull().references(() => evaluationRuns.id),
  candidateRunId: id("candidate_run_id").notNull().references(() => evaluationRuns.id),
  avgScoreDelta: double("avg_score_delta").notNull(),
  passRateDelta: double("pass_rate_delta").notNull(),
  latencyDeltaMs: double("latency_delta_ms").notNull(),
  improvedCount: int("improved_count").notNull(),
  regressedCount: int("regressed_count").notNull(),
  unchangedCount: int("unchanged_count").notNull(),
  createdAt: timestampText("created_at"),
}, (table) => ({
  promptIdx: index("idx_evaluation_comparisons_prompt").on(table.promptId),
}));

export const securityScans = mysqlTable("security_scans", {
  id: id().primaryKey(),
  promptVersionId: id("prompt_version_id").notNull().references(() => promptVersions.id),
  status: statusText("status", ["pending", "running", "completed", "failed"]).notNull().default("pending"),
  provider: shortText("provider").notNull().default("mock"),
  riskScore: double("risk_score"),
  passed: boolean("passed"),
  createdAt: timestampText("created_at"),
  completedAt: shortText("completed_at", 40),
}, (table) => ({
  versionIdx: index("idx_security_scans_version").on(table.promptVersionId),
}));

export const securityFindings = mysqlTable("security_findings", {
  id: id().primaryKey(),
  scanId: id("scan_id").notNull().references(() => securityScans.id, { onDelete: "cascade" }),
  testName: shortText("test_name").notNull(),
  attackInput: longtext("attack_input").notNull(),
  modelOutput: longtext("model_output").notNull(),
  riskLevel: statusText("risk_level", ["low", "medium", "high", "critical"]).notNull(),
  description: longtext("description").notNull(),
  recommendation: longtext("recommendation").default(""),
  passed: boolean("passed").notNull(),
}, (table) => ({
  scanIdx: index("idx_security_findings_scan").on(table.scanId),
}));

export const promptOptimizations = mysqlTable("prompt_optimizations", {
  id: id().primaryKey(),
  scanId: id("scan_id").notNull().references(() => securityScans.id, { onDelete: "cascade" }),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  sourceVersionId: id("source_version_id").notNull().references(() => promptVersions.id),
  candidateVersionId: id("candidate_version_id").references(() => promptVersions.id),
  status: statusText("status", ["draft", "applied"]).notNull().default("draft"),
  provider: shortText("provider").notNull().default("mock"),
  model: shortText("model").notNull().default("promptguard-review"),
  summary: longtext("summary").notNull(),
  overallRiskLevel: statusText("overall_risk_level", ["low", "medium", "high", "critical"]).notNull(),
  overallRiskScore: double("overall_risk_score").notNull(),
  leakProbability: double("leak_probability").notNull(),
  reviewJson: longtext("review_json").notNull(),
  optimizedPrompt: longtext("optimized_prompt").notNull(),
  createdBy: shortText("created_by").default("system"),
  createdAt: timestampText("created_at"),
  appliedAt: shortText("applied_at", 40),
}, (table) => ({
  scanIdx: index("idx_prompt_optimizations_scan").on(table.scanId),
  promptIdx: index("idx_prompt_optimizations_prompt").on(table.promptId),
}));

export const reviewRequests = mysqlTable("review_requests", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: id("prompt_version_id").notNull().references(() => promptVersions.id),
  evaluationRunId: id("evaluation_run_id").references(() => evaluationRuns.id),
  securityScanId: id("security_scan_id").references(() => securityScans.id),
  status: statusText("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  submittedBy: shortText("submitted_by").default("engineer"),
  reviewedBy: shortText("reviewed_by"),
  comment: longtext("comment").default(""),
  createdAt: timestampText("created_at"),
  reviewedAt: shortText("reviewed_at", 40),
}, (table) => ({
  promptIdx: index("idx_review_requests_prompt").on(table.promptId),
  versionIdx: index("idx_review_requests_version").on(table.promptVersionId),
}));

export const grayReleases = mysqlTable("gray_releases", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: id("prompt_version_id").notNull().references(() => promptVersions.id),
  trafficPercent: int("traffic_percent").notNull(),
  status: statusText("status", ["active", "completed", "rolled_back"]).notNull().default("active"),
  note: longtext("note").default(""),
  observationScore: double("observation_score"),
  observationLatencyMs: int("observation_latency_ms"),
  observationCost: double("observation_cost"),
  createdAt: timestampText("created_at"),
  endedAt: shortText("ended_at", 40),
}, (table) => ({
  promptIdx: index("idx_gray_releases_prompt").on(table.promptId),
  versionIdx: index("idx_gray_releases_version").on(table.promptVersionId),
}));

export const routePolicies = mysqlTable("route_policies", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  environment: shortText("environment").notNull().default("production"),
  stableVersionId: id("stable_version_id").references(() => promptVersions.id),
  grayVersionId: id("gray_version_id").references(() => promptVersions.id),
  trafficPercent: int("traffic_percent").notNull().default(0),
  status: statusText("status", ["idle", "gray", "full", "rolled_back"]).notNull().default("idle"),
  updatedBy: shortText("updated_by").default("system"),
  note: longtext("note").default(""),
  createdAt: timestampText("created_at"),
  updatedAt: timestampText("updated_at"),
}, (table) => ({
  promptEnvironment: uniqueIndex("idx_route_policies_prompt_environment").on(table.promptId, table.environment),
}));

export const releaseEvents = mysqlTable("release_events", {
  id: id().primaryKey(),
  promptId: id("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  promptVersionId: id("prompt_version_id").references(() => promptVersions.id),
  eventType: statusText("event_type", ["gray_start", "gray_expand", "full_release", "rollback"]).notNull(),
  detail: longtext("detail").default(""),
  createdAt: timestampText("created_at"),
}, (table) => ({
  promptIdx: index("idx_release_events_prompt").on(table.promptId),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: id().primaryKey(),
  action: shortText("action").notNull(),
  entityType: shortText("entity_type").notNull(),
  entityId: shortText("entity_id").notNull(),
  actor: shortText("actor").default("system"),
  detail: longtext("detail").default(""),
  createdAt: timestampText("created_at"),
}, (table) => ({
  entityIdx: index("idx_audit_logs_entity").on(table.entityType, table.entityId),
}));

export const reportRecords = mysqlTable("report_records", {
  id: id().primaryKey(),
  type: statusText("type", ["evaluation", "diff", "security", "release", "audit"]).notNull(),
  sourceId: shortText("source_id").notNull(),
  format: statusText("format", ["json", "html"]).notNull(),
  filePath: longtext("file_path").notNull(),
  generatedBy: shortText("generated_by").default("system"),
  createdAt: timestampText("created_at"),
}, (table) => ({
  sourceIdx: index("idx_report_records_source").on(table.sourceId),
}));

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
  optimizations: many(promptOptimizations),
}));

export const promptOptimizationsRelations = relations(promptOptimizations, ({ one }) => ({
  scan: one(securityScans, { fields: [promptOptimizations.scanId], references: [securityScans.id] }),
  prompt: one(prompts, { fields: [promptOptimizations.promptId], references: [prompts.id] }),
  sourceVersion: one(promptVersions, {
    fields: [promptOptimizations.sourceVersionId],
    references: [promptVersions.id],
  }),
  candidateVersion: one(promptVersions, {
    fields: [promptOptimizations.candidateVersionId],
    references: [promptVersions.id],
  }),
}));
