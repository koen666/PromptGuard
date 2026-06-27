import { GuardedPrompt } from "../../packages/core/dist/index.js";

export async function answerKnowledgeQuestion(question) {
  const prompt = await GuardedPrompt.load("pre-知识库问答助手", {
    environment: "production",
    routeKey: "kb-web",
  });

  return prompt.run(question, {
    blockUnsafeInput: true,
  });
}
