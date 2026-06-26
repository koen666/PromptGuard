import { MockLlmAdapter } from "./mock.js";
import type {
  EvaluationScores,
  LlmAdapter,
  LlmCompletionRequest,
  LlmCompletionResult,
  SecurityAssessment,
} from "./types.js";

export class OllamaAdapter implements LlmAdapter {
  readonly provider = "ollama";
  private fallback = new MockLlmAdapter();

  constructor(
    private defaultModel: string,
    private baseUrl: string,
  ) {}

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = request.model && !request.model.startsWith("mock-") && request.model !== "security-probe"
      ? request.model
      : this.defaultModel;
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userInput },
          ],
          options: {
            temperature: 0.2,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };
      const tokenCount = (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0);
      return {
        output: data.message?.content ?? "",
        latencyMs: Date.now() - start,
        model,
        provider: this.provider,
        tokenCount,
        cost: 0,
      };
    } catch (error) {
      if (process.env.PROMPTGUARD_ALLOW_MOCK_FALLBACK === "1") {
        const mock = await this.fallback.complete(request);
        return { ...mock, provider: `${this.provider}(fallback-mock)` };
      }
      throw error;
    }
  }

  scoreEvaluation(output: string, expectedBehavior?: string): EvaluationScores {
    return this.fallback.scoreEvaluation(output, expectedBehavior);
  }

  assessSecurity(output: string, attackType: string): SecurityAssessment {
    return this.fallback.assessSecurity(output, attackType);
  }
}
