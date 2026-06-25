import { eq } from "drizzle-orm";
import { getDatabasePath, getLlmConfig, type LlmProvider } from "../config.js";
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
  const models = await db.select().from(modelConfig);
  const alerts = await db.select().from(alertRules);

  return {
    provider: (values.llmProvider as LlmProvider) ?? envConfig.provider,
    databasePath: getDatabasePath(),
    openaiModel: values.openaiModel ?? envConfig.openaiModel,
    anthropicModel: values.anthropicModel ?? envConfig.anthropicModel,
    hasOpenAiKey: !!(values.openaiApiKey || envConfig.openaiApiKey),
    hasAnthropicKey: !!(values.anthropicApiKey || envConfig.anthropicApiKey),
    models,
    alerts,
  };
}

export async function updateSystemSettings(input: {
  provider?: LlmProvider;
  openaiModel?: string;
  anthropicModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  alertRules?: Array<{ metric: string; operator: ">" | ">=" | "<" | "<="; threshold: number; severity: "low" | "medium" | "high"; enabled: boolean }>;
  actor?: string;
}) {
  if (input.provider && !["mock", "openai", "anthropic"].includes(input.provider)) {
    throw new Error("Invalid provider");
  }
  await ensureDefaultSettings();
  const db = getDb();
  if (input.provider) await upsertConfig("llmProvider", input.provider);
  if (input.openaiModel?.trim()) await upsertConfig("openaiModel", input.openaiModel.trim());
  if (input.anthropicModel?.trim()) await upsertConfig("anthropicModel", input.anthropicModel.trim());
  if (typeof input.openaiApiKey === "string" && input.openaiApiKey.trim()) {
    await upsertConfig("openaiApiKey", input.openaiApiKey.trim());
  }
  if (typeof input.anthropicApiKey === "string" && input.anthropicApiKey.trim()) {
    await upsertConfig("anthropicApiKey", input.anthropicApiKey.trim());
  }

  if (input.provider) process.env.LLM_PROVIDER = input.provider;
  if (input.openaiModel?.trim()) process.env.OPENAI_MODEL = input.openaiModel.trim();
  if (input.anthropicModel?.trim()) process.env.ANTHROPIC_MODEL = input.anthropicModel.trim();
  if (typeof input.openaiApiKey === "string" && input.openaiApiKey.trim()) {
    process.env.OPENAI_API_KEY = input.openaiApiKey.trim();
  }
  if (typeof input.anthropicApiKey === "string" && input.anthropicApiKey.trim()) {
    process.env.ANTHROPIC_API_KEY = input.anthropicApiKey.trim();
  }

  await upsertModel("mock", "mock-gpt", input.provider === "mock");
  if (input.openaiModel?.trim()) await upsertModel("openai", input.openaiModel.trim(), input.provider === "openai");
  if (input.anthropicModel?.trim()) await upsertModel("anthropic", input.anthropicModel.trim(), input.provider === "anthropic");

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
  return getSystemSettings();
}

async function ensureDefaultSettings() {
  const config = getLlmConfig();
  await upsertConfig("llmProvider", config.provider, false);
  await upsertConfig("openaiModel", config.openaiModel, false);
  await upsertConfig("anthropicModel", config.anthropicModel, false);
  await upsertModel("mock", "mock-gpt", config.provider === "mock", false);
  await upsertModel("openai", config.openaiModel, config.provider === "openai", false);
  await upsertModel("anthropic", config.anthropicModel, config.provider === "anthropic", false);
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

async function upsertModel(provider: "mock" | "openai" | "anthropic", model: string, enabled: boolean, overwrite = true) {
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
