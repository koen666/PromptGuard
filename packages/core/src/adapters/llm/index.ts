import { getLlmConfig } from "../../config.js";
import { AnthropicAdapter } from "./anthropic.js";
import { MockLlmAdapter } from "./mock.js";
import { OpenAiAdapter } from "./openai.js";
import type { LlmAdapter } from "./types.js";

let adapterInstance: LlmAdapter | null = null;

export function getLlmAdapter(): LlmAdapter {
  if (adapterInstance) return adapterInstance;
  const config = getLlmConfig();
  if (config.provider === "openai" && config.openaiApiKey) {
    adapterInstance = new OpenAiAdapter(config.openaiApiKey, config.openaiModel);
  } else if (config.provider === "anthropic" && config.anthropicApiKey) {
    adapterInstance = new AnthropicAdapter(config.anthropicApiKey, config.anthropicModel);
  } else {
    adapterInstance = new MockLlmAdapter();
  }
  return adapterInstance;
}

export function resetLlmAdapter() {
  adapterInstance = null;
}

export * from "./types.js";
