import { MockLlmAdapter } from "./mock.js";
import type {
  EvaluationScores,
  LlmAdapter,
  LlmCompletionRequest,
  LlmCompletionResult,
  SecurityAssessment,
} from "./types.js";

export class AnthropicAdapter implements LlmAdapter {
  readonly provider = "anthropic";
  private fallback = new MockLlmAdapter();

  constructor(
    private apiKey: string,
    private defaultModel: string,
  ) {}

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const start = Date.now();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          max_tokens: 1024,
          system: request.systemPrompt,
          messages: [{ role: "user", content: request.userInput }],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        content: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = data.content.find((c) => c.type === "text")?.text ?? "";
      const tokenCount = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
      return {
        output: text,
        latencyMs: Date.now() - start,
        model: request.model || this.defaultModel,
        provider: this.provider,
        tokenCount,
        cost: tokenCount * 0.000006,
      };
    } catch {
      const mock = await this.fallback.complete(request);
      return { ...mock, provider: `${this.provider}(fallback-mock)` };
    }
  }

  scoreEvaluation(output: string, expectedBehavior?: string): EvaluationScores {
    return this.fallback.scoreEvaluation(output, expectedBehavior);
  }

  assessSecurity(output: string, attackType: string): SecurityAssessment {
    return this.fallback.assessSecurity(output, attackType);
  }
}
