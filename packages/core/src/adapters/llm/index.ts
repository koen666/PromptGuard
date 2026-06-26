import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getDatabasePath, getLlmConfig } from "../../config.js";
import { AnthropicAdapter } from "./anthropic.js";
import { MockLlmAdapter } from "./mock.js";
import { OllamaAdapter } from "./ollama.js";
import { OpenAiAdapter } from "./openai.js";
import type { LlmAdapter } from "./types.js";

const require = createRequire(fileURLToPath(import.meta.url));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3") as new (filename: string) => {
  prepare: (sql: string) => { all: () => Array<{ key: string; value: string }> };
  close: () => void;
};

let adapterInstance: LlmAdapter | null = null;

export function getLlmAdapter(): LlmAdapter {
  if (adapterInstance) return adapterInstance;
  const config = getConfiguredLlm();
  if (config.provider === "openai" && config.openaiApiKey) {
    adapterInstance = new OpenAiAdapter(config.openaiApiKey, config.openaiModel);
  } else if (config.provider === "anthropic" && config.anthropicApiKey) {
    adapterInstance = new AnthropicAdapter(config.anthropicApiKey, config.anthropicModel);
  } else if (config.provider === "ollama") {
    adapterInstance = new OllamaAdapter(config.ollamaModel, config.ollamaBaseUrl);
  } else {
    adapterInstance = new MockLlmAdapter();
  }
  return adapterInstance;
}

export function resetLlmAdapter() {
  adapterInstance = null;
}

function getConfiguredLlm() {
  const envConfig = getLlmConfig();
  try {
    const db = new Database(getDatabasePath());
    const rows = db.prepare("select key, value from system_config").all();
    db.close();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return {
      ...envConfig,
      provider: (values.llmProvider as typeof envConfig.provider | undefined) ?? envConfig.provider,
      openaiModel: values.openaiModel ?? envConfig.openaiModel,
      anthropicModel: values.anthropicModel ?? envConfig.anthropicModel,
      ollamaModel: values.ollamaModel ?? envConfig.ollamaModel,
      ollamaBaseUrl: values.ollamaBaseUrl ?? envConfig.ollamaBaseUrl,
      openaiApiKey: values.openaiApiKey ?? envConfig.openaiApiKey,
      anthropicApiKey: values.anthropicApiKey ?? envConfig.anthropicApiKey,
    };
  } catch {
    return envConfig;
  }
}

export * from "./types.js";
