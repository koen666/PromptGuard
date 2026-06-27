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
    adapterInstance = new OpenAiAdapter({
      apiKey: config.openaiApiKey,
      defaultModel: config.openaiModel,
      reviewModel: config.openaiReviewModel,
      baseUrl: config.openaiBaseUrl,
      wireApi: config.openaiWireApi,
      reasoningEffort: config.openaiReasoningEffort,
      disableResponseStorage: config.openaiDisableResponseStorage,
      fallbackToMock: config.openaiFallbackToMock,
    });
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
      openaiBaseUrl: values.openaiBaseUrl ?? envConfig.openaiBaseUrl,
      openaiWireApi: (values.openaiWireApi as typeof envConfig.openaiWireApi | undefined) ?? envConfig.openaiWireApi,
      openaiModel: values.openaiModel ?? envConfig.openaiModel,
      openaiReviewModel: values.openaiReviewModel ?? envConfig.openaiReviewModel,
      openaiReasoningEffort: values.openaiReasoningEffort ?? envConfig.openaiReasoningEffort,
      openaiDisableResponseStorage: values.openaiDisableResponseStorage
        ? values.openaiDisableResponseStorage === "true"
        : envConfig.openaiDisableResponseStorage,
      openaiFallbackToMock: values.openaiFallbackToMock
        ? values.openaiFallbackToMock === "true"
        : envConfig.openaiFallbackToMock,
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
