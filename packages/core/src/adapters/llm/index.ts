import { getLlmConfig } from "../../config.js";
import { AnthropicAdapter } from "./anthropic.js";
import { MockLlmAdapter } from "./mock.js";
import { OllamaAdapter } from "./ollama.js";
import { OpenAiAdapter } from "./openai.js";
import type { LlmAdapter } from "./types.js";

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
  return getLlmConfig();
}

export * from "./types.js";
