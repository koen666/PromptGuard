import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client.js";
import {
  alertRecords,
  alertRules,
  grayReleases,
  evaluationRuns,
  metricSamples,
  promptVersions,
  prompts,
  releaseEvents,
  reviewRequests,
  routePolicies,
  securityFindings,
  securityScans,
} from "../db/schema.js";
import { createId } from "../utils/id.js";
import { logAudit } from "./audit.js";
import { getPrompt, getPromptVersionByNumber } from "./prompt.js";

const DEFAULT_ENVIRONMENT = "production";

export async function submitReview(input: {
  promptId: string;
  versionNumber: number;
  submittedBy?: string;
  comment?: string;
}) {
  const prompt = await getPrompt(input.promptId);
  if (!prompt) throw new Error("Prompt not found");
  const version = await getPromptVersionByNumber(input.promptId, input.versionNumber);
  if (!version) throw new Error("Version not found");

  const db = getDb();
  const evidence = await getReviewEvidence(version.id);
  const id = createId("review");

  await db.insert(reviewRequests).values({
    id,
    promptId: input.promptId,
    promptVersionId: version.id,
    evaluationRunId: evidence.evaluationRun.id,
    securityScanId: evidence.securityScan.id,
    status: "pending",
    submittedBy: input.submittedBy ?? "engineer",
    comment: input.comment ?? "",
  });

  await db
    .update(prompts)
    .set({ status: "draft", updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, input.promptId));

  await logAudit({ action: "review_submit", entityType: "review", entityId: id });
  return id;
}

export async function listReviews(status?: "pending" | "approved" | "rejected") {
  const db = getDb();
  const all = await db.select().from(reviewRequests).orderBy(desc(reviewRequests.createdAt));
  if (!status) return all;
  return all.filter((r) => r.status === status);
}

export async function approveReview(id: string, reviewedBy = "reviewer", comment = "") {
  const db = getDb();
  const [review] = await db.select().from(reviewRequests).where(eq(reviewRequests.id, id));
  if (!review) throw new Error("Review not found");
  if (!review.evaluationRunId || !review.securityScanId) {
    throw new Error("Review requires bound evaluation and security evidence");
  }
  const [evaluationRun] = await db.select().from(evaluationRuns).where(eq(evaluationRuns.id, review.evaluationRunId));
  if (!evaluationRun || evaluationRun.status !== "completed") {
    throw new Error("Review approval requires completed evaluation evidence");
  }
  const [securityScan] = await db.select().from(securityScans).where(eq(securityScans.id, review.securityScanId));
  if (!securityScan || securityScan.status !== "completed" || !securityScan.passed) {
    throw new Error("Review approval requires a passed security scan");
  }

  await db
    .update(reviewRequests)
    .set({ status: "approved", reviewedBy, comment, reviewedAt: new Date().toISOString() })
    .where(eq(reviewRequests.id, id));

  await db
    .update(prompts)
    .set({ status: "active", activeVersionId: review.promptVersionId, updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, review.promptId));

  await logAudit({ action: "review_approve", entityType: "review", entityId: id });
  return review;
}

export async function rejectReview(id: string, reviewedBy = "reviewer", comment = "") {
  const db = getDb();
  const [review] = await db.select().from(reviewRequests).where(eq(reviewRequests.id, id));
  if (!review) throw new Error("Review not found");

  await db
    .update(reviewRequests)
    .set({ status: "rejected", reviewedBy, comment, reviewedAt: new Date().toISOString() })
    .where(eq(reviewRequests.id, id));

  await logAudit({ action: "review_reject", entityType: "review", entityId: id });
  return review;
}

export async function startGrayRelease(input: {
  promptId: string;
  versionNumber: number;
  trafficPercent: number;
  environment?: string;
  note?: string;
}) {
  const prompt = await getPrompt(input.promptId);
  if (!prompt) throw new Error("Prompt not found");
  const version = await getPromptVersionByNumber(input.promptId, input.versionNumber);
  if (!version) throw new Error("Version not found");

  validateGrayReleaseInput(input);

  const db = getDb();
  await assertVersionApproved(version.id);
  await assertSecurityGatePassed(version.id);

  const environment = normalizeEnvironment(input.environment);
  const routePolicy = await upsertRoutePolicy({
    promptId: input.promptId,
    environment,
    stableVersionId: prompt.activeVersionId ?? version.id,
    grayVersionId: version.id,
    trafficPercent: input.trafficPercent,
    status: input.trafficPercent === 100 ? "full" : "gray",
    note: input.note?.trim(),
  });

  const id = createId("gray");
  const observation = buildObservationMetrics(input.trafficPercent, version.versionNumber);

  await db.insert(grayReleases).values({
    id,
    promptId: input.promptId,
    promptVersionId: version.id,
    trafficPercent: input.trafficPercent,
    status: "active",
    note: input.note ?? "",
    observationScore: observation.score,
    observationLatencyMs: observation.latencyMs,
    observationCost: observation.cost,
  });

  await recordMetricSamples({
    releaseId: id,
    promptId: input.promptId,
    environment,
    observation,
  });

  await db.insert(releaseEvents).values({
    id: createId("rev"),
    promptId: input.promptId,
    promptVersionId: version.id,
    eventType: "gray_start",
    detail: `Gray release at ${input.trafficPercent}% in ${environment}: ${input.note?.trim()}`,
  });

  if (input.trafficPercent === 100) {
    await db
      .update(prompts)
      .set({ status: "active", activeVersionId: version.id, updatedAt: new Date().toISOString() })
      .where(eq(prompts.id, input.promptId));
  } else {
    await db.update(prompts).set({ status: "active", updatedAt: new Date().toISOString() }).where(eq(prompts.id, input.promptId));
  }

  await logAudit({
    action: "gray_release",
    entityType: "gray_release",
    entityId: id,
    detail: `${input.trafficPercent}% ${environment} policy=${routePolicy.id} ${input.note?.trim()}`,
  });

  return getGrayRelease(id);
}

export async function expandGrayRelease(input: {
  promptId: string;
  trafficPercent: number;
  environment?: string;
  note?: string;
}) {
  validateGrayReleaseInput(input);
  const environment = normalizeEnvironment(input.environment);
  const policy = await getRoutePolicy(input.promptId, environment);
  if (!policy?.grayVersionId) throw new Error("No active gray route policy");
  if (policy.status !== "gray" && policy.status !== "full") throw new Error("Route policy is not expandable");
  if (input.trafficPercent < policy.trafficPercent) throw new Error("Use rollback to reduce traffic");

  const db = getDb();
  const releases = await db
    .select()
    .from(grayReleases)
    .where(and(eq(grayReleases.promptId, input.promptId), eq(grayReleases.promptVersionId, policy.grayVersionId)))
    .orderBy(desc(grayReleases.createdAt));
  const activeRelease = releases.find((item) => item.status === "active");
  if (!activeRelease) throw new Error("No active gray release");

  const versionNumber = await getVersionNumber(policy.grayVersionId);
  const observation = buildObservationMetrics(input.trafficPercent, versionNumber);

  await db
    .update(grayReleases)
    .set({
      trafficPercent: input.trafficPercent,
      observationScore: observation.score,
      observationLatencyMs: observation.latencyMs,
      observationCost: observation.cost,
    })
    .where(eq(grayReleases.id, activeRelease.id));

  await upsertRoutePolicy({
    promptId: input.promptId,
    environment,
    stableVersionId: policy.stableVersionId,
    grayVersionId: policy.grayVersionId,
    trafficPercent: input.trafficPercent,
    status: input.trafficPercent === 100 ? "full" : "gray",
    note: input.note?.trim(),
  });

  await recordMetricSamples({
    releaseId: activeRelease.id,
    promptId: input.promptId,
    environment,
    observation,
  });

  await db.insert(releaseEvents).values({
    id: createId("rev"),
    promptId: input.promptId,
    promptVersionId: policy.grayVersionId,
    eventType: input.trafficPercent === 100 ? "full_release" : "gray_expand",
    detail: `${environment} traffic expanded to ${input.trafficPercent}%: ${input.note?.trim()}`,
  });

  await logAudit({
    action: "gray_expand",
    entityType: "gray_release",
    entityId: activeRelease.id,
    detail: `${input.trafficPercent}% ${environment} ${input.note?.trim()}`,
  });

  return getGrayRelease(activeRelease.id);
}

export async function promoteRelease(promptId: string, environment = DEFAULT_ENVIRONMENT, note = "Promote gray release") {
  const release = await expandGrayRelease({
    promptId,
    environment,
    trafficPercent: 100,
    note,
  });
  if (!release) throw new Error("Release not found");
  const db = getDb();
  await db
    .update(grayReleases)
    .set({
      status: "completed",
      trafficPercent: 100,
      observationScore: release.observationScore,
      observationLatencyMs: release.observationLatencyMs,
      observationCost: release.observationCost,
      endedAt: new Date().toISOString(),
    })
    .where(eq(grayReleases.id, release.id));
  await db
    .update(prompts)
    .set({ activeVersionId: release.promptVersionId, status: "active", updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, promptId));
  await upsertRoutePolicy({
    promptId,
    environment: normalizeEnvironment(environment),
    stableVersionId: release.promptVersionId,
    grayVersionId: null,
    trafficPercent: 100,
    status: "full",
    note,
  });
  await logAudit({
    action: "release_promote",
    entityType: "gray_release",
    entityId: release.id,
    detail: `${environment} ${note}`,
  });
  return getGrayRelease(release.id);
}

function validateGrayReleaseInput(input: { trafficPercent: number; note?: string }) {
  if (!Number.isInteger(input.trafficPercent) || input.trafficPercent < 0 || input.trafficPercent > 100) {
    throw new Error("Traffic percent must be an integer between 0 and 100");
  }
  if (!input.note?.trim()) {
    throw new Error("Release reason is required");
  }
}

function normalizeEnvironment(environment?: string) {
  const normalized = environment?.trim().toLowerCase() || DEFAULT_ENVIRONMENT;
  if (!/^[a-z0-9_-]{2,32}$/.test(normalized)) {
    throw new Error("Environment must be 2-32 characters using letters, numbers, underscore, or dash");
  }
  return normalized;
}

async function upsertRoutePolicy(input: {
  promptId: string;
  environment: string;
  stableVersionId?: string | null;
  grayVersionId?: string | null;
  trafficPercent: number;
  status: "idle" | "gray" | "full" | "rolled_back";
  note?: string;
  updatedBy?: string;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(routePolicies)
    .where(and(eq(routePolicies.promptId, input.promptId), eq(routePolicies.environment, input.environment)));

  const values = {
    stableVersionId: input.stableVersionId ?? null,
    grayVersionId: input.grayVersionId ?? null,
    trafficPercent: input.trafficPercent,
    status: input.status,
    updatedBy: input.updatedBy ?? "system",
    note: input.note ?? "",
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await db.update(routePolicies).set(values).where(eq(routePolicies.id, existing.id));
    return { ...existing, ...values };
  }

  const id = createId("route");
  await db.insert(routePolicies).values({
    id,
    promptId: input.promptId,
    environment: input.environment,
    ...values,
  });
  return { id, promptId: input.promptId, environment: input.environment, ...values };
}

async function assertVersionApproved(promptVersionId: string) {
  const db = getDb();
  const [approved] = await db
    .select()
    .from(reviewRequests)
    .where(and(eq(reviewRequests.promptVersionId, promptVersionId), eq(reviewRequests.status, "approved")))
    .orderBy(desc(reviewRequests.reviewedAt))
    .limit(1);
  if (!approved) {
    throw new Error("Version must be approved before gray release");
  }
}

async function assertSecurityGatePassed(promptVersionId: string) {
  const db = getDb();
  const [scan] = await db
    .select()
    .from(securityScans)
    .where(and(eq(securityScans.promptVersionId, promptVersionId), eq(securityScans.status, "completed")))
    .orderBy(desc(securityScans.completedAt))
    .limit(1);

  if (!scan) {
    throw new Error("Completed security scan is required before gray release");
  }
  if (!scan.passed) {
    throw new Error("Security scan must pass before gray release");
  }

  const blockingFindings = await db
    .select()
    .from(securityFindings)
    .where(and(eq(securityFindings.scanId, scan.id), inArray(securityFindings.riskLevel, ["high", "critical"])));
  if (blockingFindings.length) {
    throw new Error("High-risk security findings block gray release");
  }
}

async function getReviewEvidence(promptVersionId: string) {
  const db = getDb();
  const [evaluationRun] = await db
    .select()
    .from(evaluationRuns)
    .where(and(eq(evaluationRuns.promptVersionId, promptVersionId), eq(evaluationRuns.status, "completed")))
    .orderBy(desc(evaluationRuns.completedAt))
    .limit(1);
  if (!evaluationRun) {
    throw new Error("Completed evaluation is required before submitting review");
  }

  const [securityScan] = await db
    .select()
    .from(securityScans)
    .where(and(eq(securityScans.promptVersionId, promptVersionId), eq(securityScans.status, "completed")))
    .orderBy(desc(securityScans.completedAt))
    .limit(1);
  if (!securityScan) {
    throw new Error("Completed security scan is required before submitting review");
  }

  return { evaluationRun, securityScan };
}

export async function listGrayReleases() {
  const db = getDb();
  return db.select().from(grayReleases).orderBy(desc(grayReleases.createdAt));
}

export async function listRoutePolicies(promptId?: string) {
  const db = getDb();
  const query = db.select().from(routePolicies).orderBy(desc(routePolicies.updatedAt));
  if (!promptId) return query;
  return db.select().from(routePolicies).where(eq(routePolicies.promptId, promptId)).orderBy(desc(routePolicies.updatedAt));
}

export async function getRoutePolicy(promptId: string, environment = DEFAULT_ENVIRONMENT) {
  const db = getDb();
  const [policy] = await db
    .select()
    .from(routePolicies)
    .where(and(eq(routePolicies.promptId, promptId), eq(routePolicies.environment, normalizeEnvironment(environment))));
  return policy ?? null;
}

export async function getGrayRelease(id: string) {
  const db = getDb();
  const [release] = await db.select().from(grayReleases).where(eq(grayReleases.id, id));
  return release ?? null;
}

export async function getReleaseObservation(releaseId: string) {
  const db = getDb();
  const release = await getGrayRelease(releaseId);
  if (!release) return null;
  const samples = await db
    .select()
    .from(metricSamples)
    .where(eq(metricSamples.releaseId, releaseId))
    .orderBy(desc(metricSamples.sampledAt));
  const alerts = await db
    .select()
    .from(alertRecords)
    .where(eq(alertRecords.releaseId, releaseId))
    .orderBy(desc(alertRecords.createdAt));
  return { release, samples, alerts };
}

export async function listMetricSamples(releaseId?: string) {
  const db = getDb();
  if (releaseId) {
    return db.select().from(metricSamples).where(eq(metricSamples.releaseId, releaseId)).orderBy(desc(metricSamples.sampledAt));
  }
  return db.select().from(metricSamples).orderBy(desc(metricSamples.sampledAt)).limit(300);
}

export async function listAlertRecords(status?: "open" | "resolved") {
  const db = getDb();
  if (status) {
    return db.select().from(alertRecords).where(eq(alertRecords.status, status)).orderBy(desc(alertRecords.createdAt)).limit(100);
  }
  return db.select().from(alertRecords).orderBy(desc(alertRecords.createdAt)).limit(100);
}

export async function listReleaseHistory(promptId?: string) {
  const db = getDb();
  if (promptId) {
    return db.select().from(releaseEvents).where(eq(releaseEvents.promptId, promptId)).orderBy(desc(releaseEvents.createdAt));
  }
  return db.select().from(releaseEvents).orderBy(desc(releaseEvents.createdAt)).limit(200);
}

export async function rollbackRelease(promptId: string, versionNumber: number, environment = DEFAULT_ENVIRONMENT, reason?: string) {
  if (!reason?.trim()) throw new Error("Rollback reason is required");
  const prompt = await getPrompt(promptId);
  if (!prompt) throw new Error("Prompt not found");
  const version = await getPromptVersionByNumber(promptId, versionNumber);
  if (!version) throw new Error("Version not found");
  await assertVersionApproved(version.id);
  await assertVersionPreviouslyReleased(version.id);

  const normalizedEnvironment = normalizeEnvironment(environment);
  const db = getDb();

  const activeReleases = await db
    .select()
    .from(grayReleases)
    .where(eq(grayReleases.promptId, promptId));

  for (const r of activeReleases.filter((x) => x.status === "active")) {
    await db
      .update(grayReleases)
      .set({ status: "rolled_back", endedAt: new Date().toISOString() })
      .where(eq(grayReleases.id, r.id));
  }

  await db
    .update(prompts)
    .set({ status: "active", activeVersionId: version.id, updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, promptId));

  await upsertRoutePolicy({
    promptId,
    environment: normalizedEnvironment,
    stableVersionId: version.id,
    grayVersionId: null,
    trafficPercent: 0,
    status: "rolled_back",
    note: reason.trim(),
  });

  await db.insert(releaseEvents).values({
    id: createId("rev"),
    promptId,
    promptVersionId: version.id,
    eventType: "rollback",
    detail: `Rolled back ${normalizedEnvironment} to v${versionNumber}: ${reason.trim()}`,
  });

  await logAudit({ action: "rollback", entityType: "prompt", entityId: promptId, detail: `${normalizedEnvironment} v${versionNumber} ${reason.trim()}` });
  return getPrompt(promptId);
}

async function assertVersionPreviouslyReleased(promptVersionId: string) {
  const db = getDb();
  const releaseRows = await db
    .select()
    .from(grayReleases)
    .where(and(eq(grayReleases.promptVersionId, promptVersionId), inArray(grayReleases.status, ["active", "completed", "rolled_back"])));
  if (releaseRows.length) return;

  const routePolicyRows = await db
    .select()
    .from(routePolicies)
    .where(eq(routePolicies.stableVersionId, promptVersionId));
  if (routePolicyRows.length) return;

  throw new Error("Rollback target must have been released before");
}

export async function getDashboardStats() {
  const db = getDb();
  const allPrompts = await db.select().from(prompts);
  const pendingReviews = (await listReviews("pending")).length;
  const activeGray = (await listRoutePolicies()).filter((policy) => policy.status === "gray" && policy.trafficPercent > 0).length;
  return {
    totalPrompts: allPrompts.length,
    activePrompts: allPrompts.filter((p) => p.status === "active").length,
    pendingReviews,
    activeGrayReleases: activeGray,
  };
}

interface ObservationMetrics {
  score: number;
  latencyMs: number;
  cost: number;
  errorRate: number;
}

function buildObservationMetrics(trafficPercent: number, versionNumber: number): ObservationMetrics {
  const loadFactor = trafficPercent / 100;
  const versionFactor = (versionNumber % 7) * 0.01;
  const latencyMs = Math.round(150 + loadFactor * 420 + versionFactor * 1000);
  const cost = Number((0.003 + loadFactor * 0.038 + versionFactor).toFixed(5));
  const errorRate = Number(Math.min(0.18, 0.006 + loadFactor * 0.055 + versionFactor / 2).toFixed(4));
  const score = Number(Math.max(0, 0.96 - errorRate * 2.8 - Math.max(0, latencyMs - 500) / 1400).toFixed(4));
  return { score, latencyMs, cost, errorRate };
}

async function recordMetricSamples(input: {
  releaseId: string;
  promptId: string;
  environment: string;
  observation: ObservationMetrics;
}) {
  const db = getDb();
  const samples = [
    { metric: "observation_score", value: input.observation.score, unit: "score" },
    { metric: "latency_ms", value: input.observation.latencyMs, unit: "ms" },
    { metric: "cost", value: input.observation.cost, unit: "usd" },
    { metric: "error_rate", value: input.observation.errorRate, unit: "ratio" },
  ];

  for (const sample of samples) {
    await db.insert(metricSamples).values({
      id: createId("metric"),
      releaseId: input.releaseId,
      promptId: input.promptId,
      environment: input.environment,
      metric: sample.metric,
      value: sample.value,
      unit: sample.unit,
    });
  }

  await evaluateAlertRules(input.releaseId, Object.fromEntries(samples.map((sample) => [sample.metric, sample.value])));
}

async function evaluateAlertRules(releaseId: string, values: Record<string, number>) {
  const db = getDb();
  const rules = await db.select().from(alertRules).where(eq(alertRules.enabled, true));
  for (const rule of rules) {
    const value = values[rule.metric];
    if (value == null) continue;
    if (!compareMetric(value, rule.operator, rule.threshold)) continue;

    await db.insert(alertRecords).values({
      id: createId("alertrec"),
      ruleId: rule.id,
      releaseId,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      status: "open",
      message: `${rule.metric} ${value} ${rule.operator} ${rule.threshold}`,
    });
  }
}

function compareMetric(value: number, operator: string, threshold: number) {
  if (operator === ">") return value > threshold;
  if (operator === ">=") return value >= threshold;
  if (operator === "<") return value < threshold;
  if (operator === "<=") return value <= threshold;
  return false;
}

async function getVersionNumber(promptVersionId: string) {
  const db = getDb();
  const [version] = await db.select().from(promptVersions).where(eq(promptVersions.id, promptVersionId));
  if (!version) throw new Error("Version not found");
  return version.versionNumber;
}
