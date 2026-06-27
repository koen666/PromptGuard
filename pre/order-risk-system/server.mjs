import { GuardedPrompt } from "../../packages/core/dist/index.js";

export async function reviewOrderRisk(orderSummary) {
  const prompt = await GuardedPrompt.load("pre-订单风控审核员", {
    environment: "production",
    routeKey: "risk-reviewer",
  });

  return prompt.run(orderSummary, {
    blockUnsafeInput: true,
  });
}
