import { MockLlmAdapter } from "./mock.js";
import type {
  EvaluationScores,
  LlmAdapter,
  LlmCompletionRequest,
  LlmCompletionResult,
  SecurityAssessment,
} from "./types.js";

export class OpenAiAdapter implements LlmAdapter {
  readonly provider = "openai";
  private fallback = new MockLlmAdapter();

  constructor(
    private apiKey: string,
    private defaultModel: string,
  ) {}

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const start = Date.now();
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userInput },
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens?: number };
      };
      const tokenCount = data.usage?.total_tokens ?? 0;
      return {
        output: data.choices[0]?.message?.content ?? "",
        latencyMs: Date.now() - start,
        model: request.model || this.defaultModel,
        provider: this.provider,
        tokenCount,
        cost: tokenCount * 0.000005,
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
