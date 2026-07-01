import { describe, expect, it } from "vitest";
import {
  DATASET_IMPORT_MAX_BYTES,
  DATASET_IMPORT_MAX_CASES,
  parseDatasetText,
  validateDatasetCases,
} from "../src/services/dataset.js";
import { buildDatasetCases } from "./fixtures/dataset-fixtures.js";

describe("数据集数量边界", () => {
  it("接受最大 500 条用例", () => {
    expect(validateDatasetCases(buildDatasetCases(DATASET_IMPORT_MAX_CASES))).toEqual([]);
  });

  it("拒绝 501 条用例", () => {
    const errors = validateDatasetCases(buildDatasetCases(DATASET_IMPORT_MAX_CASES + 1));
    expect(errors).toContainEqual(expect.objectContaining({ row: 0, field: "cases" }));
  });

  it("非数组输入返回 cases 错误而不是抛出异常", () => {
    const errors = validateDatasetCases("invalid" as unknown as []);
    expect(errors).toEqual([
      expect.objectContaining({ row: 0, field: "cases" }),
    ]);
  });
});

describe("数据集字段校验", () => {
  it.each([
    ["空字符串", ""],
    ["纯空格", "   "],
    ["缺少 input", undefined],
  ])("拒绝%s", (_, input) => {
    const errors = validateDatasetCases([{ input } as never]);
    expect(errors[0]).toMatchObject({ row: 1, field: "input" });
  });

  it("拒绝非字符串 expectedBehavior", () => {
    const errors = validateDatasetCases([
      { input: "valid", expectedBehavior: 1 as unknown as string },
    ]);
    expect(errors[0]).toMatchObject({ row: 1, field: "expectedBehavior" });
  });

  it("拒绝非法 tags 类型", () => {
    const errors = validateDatasetCases([
      { input: "valid", tags: { scope: "smoke" } as unknown as string },
    ]);
    expect(errors[0]).toMatchObject({ row: 1, field: "tags" });
  });

  it("接受字符串数组 tags", () => {
    expect(validateDatasetCases([
      { input: "valid", tags: ["smoke", "security"] },
    ])).toEqual([]);
  });

  it("多个错误保留准确的行号和字段", () => {
    const errors = validateDatasetCases([
      { input: " " },
      { input: "valid", expectedBehavior: false as unknown as string },
      { input: "valid", tags: 7 as unknown as string },
    ]);

    expect(errors.map(({ row, field }) => ({ row, field }))).toEqual([
      { row: 1, field: "input" },
      { row: 2, field: "expectedBehavior" },
      { row: 3, field: "tags" },
    ]);
  });
});

describe("数据集文件大小边界", () => {
  it("拒绝超过 10MB 的 UTF-8 内容", () => {
    const oversized = JSON.stringify([
      { input: "测".repeat(Math.ceil(DATASET_IMPORT_MAX_BYTES / 3) + 1) },
    ]);
    const result = parseDatasetText({
      name: "oversized",
      format: "json",
      content: oversized,
    });

    expect(Buffer.byteLength(oversized, "utf-8")).toBeGreaterThan(DATASET_IMPORT_MAX_BYTES);
    expect(result.errors).toContainEqual(expect.objectContaining({ field: "file" }));
  });

  it("返回公开的容量限制供页面展示", () => {
    const result = parseDatasetText({
      name: "limits",
      format: "json",
      content: "[]",
    });

    expect(result.maxBytes).toBe(DATASET_IMPORT_MAX_BYTES);
    expect(result.maxCases).toBe(DATASET_IMPORT_MAX_CASES);
  });
});
