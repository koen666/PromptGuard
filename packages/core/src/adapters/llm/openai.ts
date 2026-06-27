import { MockLlmAdapter } from "./mock.js";
import type {
  EvaluationScores,
  LlmAdapter,
  LlmCompletionRequest,
  LlmCompletionResult,
  SecurityAssessment,
} from "./types.js";

export type OpenAiAdapterOptions = {
  apiKey: string;
  defaultModel: string;
  reviewModel?: string;
  baseUrl?: string;
  wireApi?: "responses" | "chat_completions";
  reasoningEffort?: string;
  disableResponseStorage?: boolean;
  fallbackToMock?: boolean;
};

type ResponseUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  usage?: ResponseUsage;
};

type ChatCompletionsPayload = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: ResponseUsage;
};

const INTERNAL_REVIEW_MODELS = new Set(["security-probe", "promptguard-runtime", "promptguard-review"]);

export class OpenAiAdapter implements LlmAdapter {
  readonly provider = "openai";
  private fallback = new MockLlmAdapter();
  private apiKey: string;
  private defaultModel: string;
  private reviewModel: string;
  private baseUrl: string;
  private wireApi: "responses" | "chat_completions";
  private reasoningEffort?: string;
  private disableResponseStorage: boolean;
  private fallbackToMock: boolean;

  constructor(apiKeyOrOptions: string | OpenAiAdapterOptions, defaultModel?: string) {
    const options = typeof apiKeyOrOptions === "string"
      ? { apiKey: apiKeyOrOptions, defaultModel: defaultModel ?? "gpt-4o-mini" }
      : apiKeyOrOptions;

    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel;
    this.reviewModel = options.reviewModel ?? options.defaultModel;
    this.baseUrl = normalizeOpenAiBaseUrl(options.baseUrl ?? "https://api.openai.com");
    this.wireApi = options.wireApi ?? "responses";
    this.reasoningEffort = options.reasoningEffort;
    this.disableResponseStorage = options.disableResponseStorage ?? true;
    this.fallbackToMock = options.fallbackToMock ?? false;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = this.resolveModel(request.model);

    try {
      const completion = this.wireApi === "chat_completions"
        ? await this.completeWithChatCompletions(request, model)
        : await this.completeWithResponses(request, model);

      return {
        output: completion.output,
        latencyMs: Date.now() - start,
        model,
        provider: `${this.provider}:${this.wireApi}`,
        tokenCount: completion.tokenCount,
        cost: estimateOpenAiCost(completion.tokenCount),
      };
    } catch (error) {
      const allowFallback = this.fallbackToMock || process.env.PROMPTGUARD_ALLOW_MOCK_FALLBACK === "1";
      if (!allowFallback) {
        throw error;
      }
      const mock = await this.fallback.complete({ ...request, model });
      return { ...mock, provider: `${this.provider}:${this.wireApi}(fallback-mock)` };
    }
  }

  scoreEvaluation(output: string, expectedBehavior?: string): EvaluationScores {
    return this.fallback.scoreEvaluation(output, expectedBehavior);
  }

  assessSecurity(output: string, attackType: string): SecurityAssessment {
    return this.fallback.assessSecurity(output, attackType);
  }

  private async completeWithResponses(request: LlmCompletionRequest, model: string) {
    const payload: Record<string, unknown> = {
      model,
      input: [
        {
          role: "system",
          content: request.systemPrompt,
        },
        {
          role: "user",
          content: request.userInput,
        },
      ],
    };

    if (this.disableResponseStorage) {
      payload.store = false;
    }
    if (this.reasoningEffort) {
      payload.reasoning = { effort: this.reasoningEffort };
    }

    const data = await this.post<ResponsesApiPayload>("/responses", payload);
    return {
      output: extractResponsesOutput(data),
      tokenCount: extractTokenCount(data.usage),
    };
  }

  private async completeWithChatCompletions(request: LlmCompletionRequest, model: string) {
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userInput },
      ],
      temperature: 0.3,
    };

    if (this.disableResponseStorage) {
      payload.store = false;
    }
    if (this.reasoningEffort) {
      payload.reasoning_effort = this.reasoningEffort;
    }

    const data = await this.post<ChatCompletionsPayload>("/chat/completions", payload);
    return {
      output: data.choices?.[0]?.message?.content ?? "",
      tokenCount: extractTokenCount(data.usage),
    };
  }

  private async post<T>(path: string, payload: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const text = await res.text();
    return parseOpenAiResponseBody(text) as T;
  }

  private resolveModel(model?: string) {
    if (!model) return this.defaultModel;
    if (INTERNAL_REVIEW_MODELS.has(model)) return this.reviewModel;
    if (model.startsWith("mock-")) return this.defaultModel;
    return model;
  }
}

function normalizeOpenAiBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function extractResponsesOutput(data: ResponsesApiPayload) {
  if (typeof data.output_text === "string") return data.output_text;
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n");
}

function extractTokenCount(usage?: ResponseUsage) {
  return usage?.total_tokens ??
    ((usage?.input_tokens ?? usage?.prompt_tokens ?? 0) + (usage?.output_tokens ?? usage?.completion_tokens ?? 0));
}

function estimateOpenAiCost(tokenCount?: number) {
  return (tokenCount ?? 0) * 0.000005;
}

function parseOpenAiResponseBody(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return parseServerSentEvents(text);
  }
}

function parseServerSentEvents(text: string) {
  const deltas: string[] = [];
  let finalPayload: unknown = null;
  let lastPayload: unknown = null;

  for (const block of text.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const event = lines.find((line) => line.startsWith("event:"))?.slice("event:".length).trim();
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim())
      .join("\n");

    if (!data || data === "[DONE]") continue;

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(data);
    } catch {
      continue;
    }

    lastPayload = payload;

    const type = typeof payload.type === "string" ? payload.type : event;
    if (type === "response.output_text.delta" && typeof payload.delta === "string") {
      deltas.push(payload.delta);
    }
    if (type === "response.completed" || event === "response.completed") {
      finalPayload = payload.response ?? payload;
    }
  }

  if (finalPayload) {
    const output = extractResponsesOutput(finalPayload as ResponsesApiPayload);
    if (output) return finalPayload;
    if (deltas.length) {
      return {
        ...(typeof finalPayload === "object" && finalPayload ? finalPayload : {}),
        output_text: deltas.join(""),
      };
    }
    return finalPayload;
  }

  if (deltas.length) return { output_text: deltas.join("") };
  if (lastPayload && typeof lastPayload === "object" && "response" in lastPayload) {
    return (lastPayload as { response: unknown }).response;
  }
  return lastPayload ?? { output_text: "" };
}
