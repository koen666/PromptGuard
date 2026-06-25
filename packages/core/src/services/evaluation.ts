import { desc, eq } from "drizzle-orm";
import { getLlmAdapter } from "../adapters/llm/index.js";
import { getLlmConfig } from "../config.js";
import { getDb } from "../db/client.js";
import { evaluationComparisons, evaluationResults, evaluationRuns } from "../db/schema.js";
import { createId } from "../utils/id.js";
import { maskSensitiveText } from "../utils/redaction.js";
import { logAudit } from "./audit.js";
import { getDataset } from "./dataset.js";
import { getPromptVersion, getPromptVersionByNumber } from "./prompt.js";

const DEFAULT_MODELS = ["mock-gpt", "mock-claude"];

export async function listEvaluationRuns() {
  const db = getDb();
  return db.select().from(evaluationRuns).orderBy(desc(evaluationRuns.createdAt));
}

export async function getEvaluationRun(id: string) {
  const db = getDb();
  const [run] = await db.select().from(evaluationRuns).where(eq(evaluationRuns.id, id));
  if (!run) return null;
  const results = await db.select().from(evaluationResults).where(eq(evaluationResults.runId, id));
  return { ...run, results, models: JSON.parse(run.models) as string[] };
}

export async function listEvaluationComparisons() {
  const db = getDb();
  return db.select().from(evaluationComparisons).orderBy(desc(evaluationComparisons.createdAt));
}

export async function getEvaluationComparison(id: string) {
  const db = getDb();
  const [comparison] = await db.select().from(evaluationComparisons).where(eq(evaluationComparisons.id, id));
  if (!comparison) return null;
  const [baselineRun, candidateRun] = await Promise.all([
    getEvaluationRun(comparison.baselineRunId),
    getEvaluationRun(comparison.candidateRunId),
  ]);
  return { ...comparison, baselineRun, candidateRun };
}

export async function runEvaluation(input: {
  promptId: string;
  versionNumber: number;
  datasetId: string;
  models?: string[];
}) {
  const version = await getPromptVersionByNumber(input.promptId, input.versionNumber);
  if (!version) throw new Error("Prompt version not found");

  const dataset = await getDataset(input.datasetId);
  if (!dataset) throw new Error("Dataset not found");
  if (!dataset.testCases.length) throw new Error("Dataset has no test cases");

  const config = getLlmConfig();
  const adapter = getLlmAdapter();
  const models = input.models ?? DEFAULT_MODELS;
  const runId = createId("eval");
  const db = getDb();

  await db.insert(evaluationRuns).values({
    id: runId,
    promptVersionId: version.id,
    datasetId: input.datasetId,
    status: "running",
    models: JSON.stringify(models),
    provider: adapter.provider,
  });

  const allScores: number[] = [];
  let totalTokens = 0;
  let totalCost = 0;
  const errors: string[] = [];

  for (const testCase of dataset.testCases) {
    for (const model of models) {
      const startedAt = Date.now();
      try {
        const completion = await adapter.complete({
          systemPrompt: version.content,
          userInput: testCase.input,
          model,
        });
        const safeOutput = maskSensitiveText(completion.output);
        const scores = adapter.scoreEvaluation(safeOutput, testCase.expectedBehavior ?? undefined);
        const avg = (scores.relevanceScore + scores.formatScore) / 2;
        const tokenCount = completion.tokenCount ?? estimateTokens(version.content, testCase.input, completion.output);
        const cost = completion.cost ?? estimateCost(adapter.provider, tokenCount);
        allScores.push(avg);
        totalTokens += tokenCount;
        totalCost += cost;

        await db.insert(evaluationResults).values({
          id: createId("eres"),
          runId,
          testCaseId: testCase.id,
          model,
          output: safeOutput,
          relevanceScore: scores.relevanceScore,
          formatScore: scores.formatScore,
          latencyMs: completion.latencyMs,
          tokenCount,
          cost,
          passed: scores.passed,
        });
      } catch (error) {
        const message = maskSensitiveText(error instanceof Error ? error.message : String(error));
        errors.push(`${model}/${testCase.id}: ${message}`);
        await db.insert(evaluationResults).values({
          id: createId("eres"),
          runId,
          testCaseId: testCase.id,
          model,
          output: "",
          relevanceScore: 0,
          formatScore: 0,
          latencyMs: Date.now() - startedAt,
          tokenCount: 0,
          cost: 0,
          errorMessage: message,
          passed: false,
        });
      }
    }
  }

  const avgScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  const status: "failed" | "completed" = errors.length ? "failed" : "completed";
  const errorMessage = errors.length ? errors.slice(0, 5).join("; ") : null;

  await db
    .update(evaluationRuns)
    .set({
      status,
      avgScore,
      totalTokens,
      totalCost,
      errorMessage,
      completedAt: new Date().toISOString(),
    })
    .where(eq(evaluationRuns.id, runId));

  await logAudit({
    action: "evaluate",
    entityType: "evaluation_run",
    entityId: runId,
    detail: `status=${status} avg=${avgScore.toFixed(2)} provider=${config.provider} tokens=${totalTokens} cost=${totalCost.toFixed(6)}`,
  });

  return getEvaluationRun(runId);
}

export async function retryEvaluationRun(id: string) {
  const run = await getEvaluationRun(id);
  if (!run) throw new Error("Evaluation run not found");
  const version = await getPromptVersion(run.promptVersionId);
  if (!version) throw new Error("Prompt version not found");
  return runEvaluation({
    promptId: version.promptId,
    versionNumber: version.versionNumber,
    datasetId: run.datasetId,
    models: run.models,
  });
}

export async function compareEvaluationVersions(input: {
  promptId: string;
  baselineVersionNumber: number;
  candidateVersionNumber: number;
  datasetId: string;
  models?: string[];
}) {
  if (input.baselineVersionNumber === input.candidateVersionNumber) {
    throw new Error("Baseline and candidate versions must be different");
  }

  const [baselineVersion, candidateVersion] = await Promise.all([
    getPromptVersionByNumber(input.promptId, input.baselineVersionNumber),
    getPromptVersionByNumber(input.promptId, input.candidateVersionNumber),
  ]);
  if (!baselineVersion) throw new Error("Baseline version not found");
  if (!candidateVersion) throw new Error("Candidate version not found");

  const [baselineRun, candidateRun] = await Promise.all([
    runEvaluation({
      promptId: input.promptId,
      versionNumber: input.baselineVersionNumber,
      datasetId: input.datasetId,
      models: input.models,
    }),
    runEvaluation({
      promptId: input.promptId,
      versionNumber: input.candidateVersionNumber,
      datasetId: input.datasetId,
      models: input.models,
    }),
  ]);
  if (!baselineRun || !candidateRun) throw new Error("Failed to run comparison evaluations");

  const baselineMetrics = summarizeRun(baselineRun.results);
  const candidateMetrics = summarizeRun(candidateRun.results);
  const sampleDeltas = buildSampleDeltas(baselineRun.results, candidateRun.results);
  const improvedCount = sampleDeltas.filter((delta) => delta.scoreDelta > 0.0001).length;
  const regressedCount = sampleDeltas.filter((delta) => delta.scoreDelta < -0.0001).length;
  const unchangedCount = sampleDeltas.length - improvedCount - regressedCount;

  const db = getDb();
  const id = createId("cmp");
  await db.insert(evaluationComparisons).values({
    id,
    promptId: input.promptId,
    baselineVersionId: baselineVersion.id,
    candidateVersionId: candidateVersion.id,
    datasetId: input.datasetId,
    baselineRunId: baselineRun.id,
    candidateRunId: candidateRun.id,
    avgScoreDelta: (candidateRun.avgScore ?? 0) - (baselineRun.avgScore ?? 0),
    passRateDelta: candidateMetrics.passRate - baselineMetrics.passRate,
    latencyDeltaMs: candidateMetrics.avgLatencyMs - baselineMetrics.avgLatencyMs,
    improvedCount,
    regressedCount,
    unchangedCount,
  });

  await logAudit({
    action: "evaluation_compare",
    entityType: "evaluation_comparison",
    entityId: id,
    detail: `v${input.baselineVersionNumber}->v${input.candidateVersionNumber} scoreDelta=${((candidateRun.avgScore ?? 0) - (baselineRun.avgScore ?? 0)).toFixed(2)}`,
  });

  return getEvaluationComparison(id);
}

function summarizeRun(results: Array<{ passed: boolean; latencyMs: number }>) {
  const total = results.length || 1;
  return {
    passRate: results.filter((result) => result.passed).length / total,
    avgLatencyMs: results.reduce((sum, result) => sum + result.latencyMs, 0) / total,
  };
}

function estimateTokens(...parts: string[]) {
  return Math.max(1, Math.ceil(parts.join("").length / 4));
}

function estimateCost(provider: string, tokenCount: number) {
  if (provider.startsWith("openai")) return tokenCount * 0.000005;
  if (provider.startsWith("anthropic")) return tokenCount * 0.000006;
  return tokenCount * 0.000001;
}

function resultScore(result: { relevanceScore: number; formatScore: number }) {
  return (result.relevanceScore + result.formatScore) / 2;
}

function buildSampleDeltas(
  baselineResults: Array<{ testCaseId: string; model: string; relevanceScore: number; formatScore: number; latencyMs: number; passed: boolean }>,
  candidateResults: Array<{ testCaseId: string; model: string; relevanceScore: number; formatScore: number; latencyMs: number; passed: boolean }>,
) {
  const baselineByKey = new Map(baselineResults.map((result) => [`${result.testCaseId}:${result.model}`, result]));
  const deltas = [];
  for (const candidate of candidateResults) {
    const baseline = baselineByKey.get(`${candidate.testCaseId}:${candidate.model}`);
    if (!baseline) continue;
    deltas.push({
      testCaseId: candidate.testCaseId,
      model: candidate.model,
      scoreDelta: resultScore(candidate) - resultScore(baseline),
      latencyDeltaMs: candidate.latencyMs - baseline.latencyMs,
      passChanged: candidate.passed !== baseline.passed,
    });
  }
  return deltas;
}

export async function getEvaluationStats() {
  const runs = await listEvaluationRuns();
  const completed = runs.filter((r) => r.status === "completed");
  return {
    total: runs.length,
    completed: completed.length,
    recentAvg: completed[0]?.avgScore ?? null,
  };
}
