export interface LlmCompletionRequest {
  systemPrompt: string;
  userInput: string;
  model: string;
}

export interface LlmCompletionResult {
  output: string;
  latencyMs: number;
  model: string;
  provider: string;
  tokenCount?: number;
  cost?: number;
}

export interface EvaluationScores {
  relevanceScore: number;
  formatScore: number;
  passed: boolean;
}

export interface SecurityAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  passed: boolean;
  description: string;
}

export interface LlmAdapter {
  readonly provider: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResult>;
  scoreEvaluation(output: string, expectedBehavior?: string): EvaluationScores;
  assessSecurity(output: string, attackType: string): SecurityAssessment;
}
