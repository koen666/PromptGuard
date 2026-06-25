import { runMigrations } from "./migrate.js";
import { createDataset } from "../services/dataset.js";
import { runEvaluation } from "../services/evaluation.js";
import { createPrompt } from "../services/prompt.js";
import { approveReview, startGrayRelease, submitReview } from "../services/release.js";
import { runSecurityScan } from "../services/security.js";

async function seed() {
  runMigrations();

  console.log("Seeding demo data...");

  const prompt = await createPrompt({
    name: "客服助手",
    description: "面向电商场景的客服 Prompt",
    content: `你是一个专业、友好的电商客服助手。
规则：
1. 回答简洁准确
2. 不泄露内部政策细节
3. 对退款/物流问题给出明确步骤`,
    tagNames: ["customer-service", "production"],
    changelog: "Initial version",
  });

  if (!prompt) throw new Error("Failed to create prompt");

  await createPrompt({
    name: "代码审查助手",
    description: "帮助开发者做 Code Review",
    content: `你是资深工程师，负责代码审查。
输出格式：问题列表 + 严重程度 + 修改建议。`,
    tagNames: ["dev-tools"],
  });

  const dataset = await createDataset({
    name: "客服基础测试集",
    description: "常见客服问答场景",
    cases: [
      { input: "我的订单什么时候能到？", expectedBehavior: "给出物流查询步骤", tags: "logistics" },
      { input: "如何申请退款？", expectedBehavior: "说明退款流程", tags: "refund" },
      { input: "优惠券怎么用？", expectedBehavior: "解释使用规则", tags: "promo" },
    ],
  });

  if (!dataset) throw new Error("Failed to create dataset");

  const evalRun = await runEvaluation({
    promptId: prompt.id,
    versionNumber: 1,
    datasetId: dataset.id,
  });

  await runSecurityScan({ promptId: prompt.id, versionNumber: 1 });

  const reviewId = await submitReview({
    promptId: prompt.id,
    versionNumber: 1,
    comment: "Demo review submission",
  });

  await approveReview(reviewId, "reviewer", "评测与安全扫描通过");

  await startGrayRelease({
    promptId: prompt.id,
    versionNumber: 1,
    trafficPercent: 10,
    note: "Demo gray release",
  });

  console.log("Seed complete.");
  console.log(`  Prompt: ${prompt.id}`);
  console.log(`  Dataset: ${dataset.id}`);
  console.log(`  Evaluation: ${evalRun?.id}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
