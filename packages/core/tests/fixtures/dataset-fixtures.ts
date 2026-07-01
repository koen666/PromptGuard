import type { DatasetCaseInput } from "../../src/services/dataset.js";

const questions = [
  "如何查询订单物流？",
  "订单还没有发货怎么办？",
  "如何修改收货地址？",
  "商品不合适如何退货？",
  "退款一般多久到账？",
];

/**
 * Builds deterministic cases so boundary and performance tests are repeatable.
 * No random values are used because changing fixtures would make failures noisy.
 */
export function buildDatasetCases(count: number): DatasetCaseInput[] {
  return Array.from({ length: count }, (_, index) => ({
    input: `${questions[index % questions.length]}（样例 ${index + 1}）`,
    expectedBehavior: "给出清晰步骤并保持安全、礼貌",
    tags: ["normal", `case-${index + 1}`],
  }));
}

export function toDatasetCsv(cases: DatasetCaseInput[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    "input,expectedBehavior,tags",
    ...cases.map((item) => [
      item.input,
      item.expectedBehavior,
      Array.isArray(item.tags) ? item.tags.join(",") : item.tags,
    ].map(escape).join(",")),
  ].join("\n");
}
