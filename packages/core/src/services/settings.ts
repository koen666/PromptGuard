import { eq } from "drizzle-orm";
import { getDatabaseLabel, getLlmConfig, type LlmProvider, type OpenAiWireApi } from "../config.js";
import { resetLlmAdapter } from "../adapters/llm/index.js";
import { alertRules, modelConfig, systemConfig } from "../db/schema.js";
import { getDb } from "../db/client.js";
import { createId } from "../utils/id.js";
import { logAudit } from "./audit.js";

export async function getSystemSettings() {
  await ensureDefaultSettings();
  const db = getDb();
  const rows = await db.select().from(systemConfig);
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const envConfig = getLlmConfig();
  const envOverrides = {
    provider: !!process.env.LLM_PROVIDER,
    openaiBaseUrl: !!process.env.OPENAI_BASE_URL,
    openaiWireApi: !!process.env.OPENAI_WIRE_API,
    openaiModel: !!(process.env.OPENAI_MODEL || process.env.MODEL),
    openaiReviewModel: !!(process.env.OPENAI_REVIEW_MODEL || process.env.REVIEW_MODEL),
    openaiReasoningEffort: !!(process.env.OPENAI_REASONING_EFFORT || process.env.MODEL_REASONING_EFFORT),
    openaiDisableResponseStorage: !!(process.env.OPENAI_DISABLE_RESPONSE_STORAGE || process.env.DISABLE_RESPONSE_STORAGE),
    anthropicModel: !!process.env.ANTHROPIC_MODEL,
    ollamaModel: !!process.env.OLLAMA_MODEL,
    ollamaBaseUrl: !!process.env.OLLAMA_BASE_URL,
  };
  const models = await db.select().from(modelConfig);
  const alerts = await db.select().from(alertRules);
  const storedOpenAiWireApi = values.openaiWireApi === "chat_completions" ? "chat_completions" : "responses";

  return {
    provider: envOverrides.provider ? envConfig.provider : ((values.llmProvider as LlmProvider) ?? envConfig.provider),
    databasePath: getDatabaseLabel(),
    openaiBaseUrl: envOverrides.openaiBaseUrl ? envConfig.openaiBaseUrl : (values.openaiBaseUrl ?? envConfig.openaiBaseUrl),
    openaiWireApi: (envOverrides.openaiWireApi ? envConfig.openaiWireApi : storedOpenAiWireApi) as OpenAiWireApi,
    openaiModel: envOverrides.openaiModel ? envConfig.openaiModel : (values.openaiModel ?? envConfig.openaiModel),
    openaiReviewModel: envOverrides.openaiReviewModel ? envConfig.openaiReviewModel : (values.openaiReviewModel ?? envConfig.openaiReviewModel),
    openaiReasoningEffort: envOverrides.openaiReasoningEffort
      ? (envConfig.openaiReasoningEffort ?? "")
      : (values.openaiReasoningEffort ?? envConfig.openaiReasoningEffort ?? ""),
    openaiDisableResponseStorage: envOverrides.openaiDisableResponseStorage
      ? envConfig.openaiDisableResponseStorage
      : (values.openaiDisableResponseStorage ?? String(envConfig.openaiDisableResponseStorage)) === "true",
    anthropicModel: envOverrides.anthropicModel ? envConfig.anthropicModel : (values.anthropicModel ?? envConfig.anthropicModel),
    ollamaModel: envOverrides.ollamaModel ? envConfig.ollamaModel : (values.ollamaModel ?? envConfig.ollamaModel),
    ollamaBaseUrl: envOverrides.ollamaBaseUrl ? envConfig.ollamaBaseUrl : (values.ollamaBaseUrl ?? envConfig.ollamaBaseUrl),
    hasOpenAiKey: !!(values.openaiApiKey || envConfig.openaiApiKey),
    hasAnthropicKey: !!(values.anthropicApiKey || envConfig.anthropicApiKey),
    models,
    alerts,
  };
}

export async function updateSystemSettings(input: {
  provider?: LlmProvider;
  openaiBaseUrl?: string;
  openaiWireApi?: "responses" | "chat_completions";
  openaiModel?: string;
  openaiReviewModel?: string;
  openaiReasoningEffort?: string;
  openaiDisableResponseStorage?: boolean;
  anthropicModel?: string;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  alertRules?: Array<{ metric: string; operator: ">" | ">=" | "<" | "<="; threshold: number; severity: "low" | "medium" | "high"; enabled: boolean }>;
  actor?: string;
}) {
  if (input.provider && !["mock", "openai", "anthropic", "ollama"].includes(input.provider)) {
    throw new Error("Invalid provider");
  }
  await ensureDefaultSettings();
  const db = getDb();
  if (input.provider) await upsertConfig("llmProvider", input.provider);
  if (input.openaiBaseUrl?.trim()) await upsertConfig("openaiBaseUrl", input.openaiBaseUrl.trim());
  if (input.openaiWireApi && ["responses", "chat_completions"].includes(input.openaiWireApi)) {
    await upsertConfig("openaiWireApi", input.openaiWireApi);
  }
  if (input.openaiModel?.trim()) await upsertConfig("openaiModel", input.openaiModel.trim());
  if (input.openaiReviewModel?.trim()) await upsertConfig("openaiReviewModel", input.openaiReviewModel.trim());
  if (typeof input.openaiReasoningEffort === "string") {
    await upsertConfig("openaiReasoningEffort", input.openaiReasoningEffort.trim());
  }
  if (typeof input.openaiDisableResponseStorage === "boolean") {
    await upsertConfig("openaiDisableResponseStorage", String(input.openaiDisableResponseStorage));
  }
  if (input.anthropicModel?.trim()) await upsertConfig("anthropicModel", input.anthropicModel.trim());
  if (input.ollamaModel?.trim()) await upsertConfig("ollamaModel", input.ollamaModel.trim());
  if (input.ollamaBaseUrl?.trim()) await upsertConfig("ollamaBaseUrl", input.ollamaBaseUrl.trim());
  if (typeof input.openaiApiKey === "string" && input.openaiApiKey.trim()) {
    await upsertConfig("openaiApiKey", input.openaiApiKey.trim());
  }
  if (typeof input.anthropicApiKey === "string" && input.anthropicApiKey.trim()) {
    await upsertConfig("anthropicApiKey", input.anthropicApiKey.trim());
  }

  if (input.provider) process.env.LLM_PROVIDER = input.provider;
  if (input.openaiBaseUrl?.trim()) process.env.OPENAI_BASE_URL = input.openaiBaseUrl.trim();
  if (input.openaiWireApi) process.env.OPENAI_WIRE_API = input.openaiWireApi;
  if (input.openaiModel?.trim()) process.env.OPENAI_MODEL = input.openaiModel.trim();
  if (input.openaiReviewModel?.trim()) process.env.OPENAI_REVIEW_MODEL = input.openaiReviewModel.trim();
  if (typeof input.openaiReasoningEffort === "string") process.env.OPENAI_REASONING_EFFORT = input.openaiReasoningEffort.trim();
  if (typeof input.openaiDisableResponseStorage === "boolean") {
    process.env.OPENAI_DISABLE_RESPONSE_STORAGE = String(input.openaiDisableResponseStorage);
  }
  if (input.anthropicModel?.trim()) process.env.ANTHROPIC_MODEL = input.anthropicModel.trim();
  if (input.ollamaModel?.trim()) process.env.OLLAMA_MODEL = input.ollamaModel.trim();
  if (input.ollamaBaseUrl?.trim()) process.env.OLLAMA_BASE_URL = input.ollamaBaseUrl.trim();
  if (typeof input.openaiApiKey === "string" && input.openaiApiKey.trim()) {
    process.env.OPENAI_API_KEY = input.openaiApiKey.trim();
  }
  if (typeof input.anthropicApiKey === "string" && input.anthropicApiKey.trim()) {
    process.env.ANTHROPIC_API_KEY = input.anthropicApiKey.trim();
  }

  await upsertModel("mock", "mock-gpt", input.provider === "mock");
  if (input.openaiModel?.trim()) await upsertModel("openai", input.openaiModel.trim(), input.provider === "openai");
  if (input.anthropicModel?.trim()) await upsertModel("anthropic", input.anthropicModel.trim(), input.provider === "anthropic");
  if (input.ollamaModel?.trim()) await upsertModel("ollama", input.ollamaModel.trim(), input.provider === "ollama");

  if (input.alertRules) {
    await db.delete(alertRules);
    for (const rule of input.alertRules) {
      if (!rule.metric.trim()) continue;
      await db.insert(alertRules).values({
        id: createId("alert"),
        metric: rule.metric.trim(),
        operator: rule.operator,
        threshold: Number(rule.threshold),
        severity: rule.severity,
        enabled: !!rule.enabled,
      });
    }
  }

  await logAudit({
    action: "settings_update",
    entityType: "system_config",
    entityId: "settings",
    actor: input.actor ?? "system",
    detail: input.provider ?? "config",
  });
  resetLlmAdapter();
  return getSystemSettings();
}

async function ensureDefaultSettings() {
  const config = getLlmConfig();
  const envProvider = !!process.env.LLM_PROVIDER;
  const envOpenAi = !!(process.env.OPENAI_BASE_URL || process.env.OPENAI_WIRE_API || process.env.OPENAI_MODEL || process.env.MODEL);
  const envAnthropic = !!process.env.ANTHROPIC_MODEL;
  const envOllama = !!(process.env.OLLAMA_MODEL || process.env.OLLAMA_BASE_URL);

  await upsertConfig("llmProvider", config.provider, envProvider);
  await upsertConfig("openaiBaseUrl", config.openaiBaseUrl, envOpenAi);
  await upsertConfig("openaiWireApi", config.openaiWireApi, envOpenAi);
  await upsertConfig("openaiModel", config.openaiModel, envOpenAi);
  await upsertConfig("openaiReviewModel", config.openaiReviewModel, envOpenAi);
  await upsertConfig("openaiReasoningEffort", config.openaiReasoningEffort ?? "", envOpenAi);
  await upsertConfig("openaiDisableResponseStorage", String(config.openaiDisableResponseStorage), envOpenAi);
  await upsertConfig("anthropicModel", config.anthropicModel, envAnthropic);
  await upsertConfig("ollamaModel", config.ollamaModel, envOllama);
  await upsertConfig("ollamaBaseUrl", config.ollamaBaseUrl, envOllama);
  await upsertModel("mock", "mock-gpt", config.provider === "mock", envProvider);
  await upsertModel("openai", config.openaiModel, config.provider === "openai", envOpenAi || envProvider);
  await upsertModel("anthropic", config.anthropicModel, config.provider === "anthropic", envAnthropic || envProvider);
  await upsertModel("ollama", config.ollamaModel, config.provider === "ollama", envOllama || envProvider);
  const db = getDb();
  const existingAlerts = await db.select().from(alertRules);
  if (!existingAlerts.length) {
    await db.insert(alertRules).values([
      { id: createId("alert"), metric: "latency_ms", operator: ">", threshold: 1500, severity: "medium", enabled: true },
      { id: createId("alert"), metric: "cost", operator: ">", threshold: 0.05, severity: "high", enabled: true },
      { id: createId("alert"), metric: "risk_score", operator: ">=", threshold: 7, severity: "high", enabled: true },
    ]);
  }
}

async function upsertConfig(key: string, value: string, overwrite = true) {
  const db = getDb();
  const [existing] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
  if (existing && !overwrite) return;
  if (existing) {
    await db.update(systemConfig).set({ value, updatedAt: new Date().toISOString() }).where(eq(systemConfig.key, key));
  } else {
    await db.insert(systemConfig).values({ key, value });
  }
}

async function upsertModel(provider: "mock" | "openai" | "anthropic" | "ollama", model: string, enabled: boolean, overwrite = true) {
  const db = getDb();
  const rows = await db.select().from(modelConfig).where(eq(modelConfig.provider, provider));
  const existing = rows[0];
  if (existing && !overwrite) return;
  if (existing) {
    await db.update(modelConfig).set({ model, enabled, updatedAt: new Date().toISOString() }).where(eq(modelConfig.id, existing.id));
  } else {
    await db.insert(modelConfig).values({ id: createId("model"), provider, model, enabled });
  }
}
