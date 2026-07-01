import { describe, expect, it } from "vitest";
import {
  DATASET_PREVIEW_PAGE_SIZE,
  parseDatasetText,
} from "../src/services/dataset.js";
import { buildDatasetCases, toDatasetCsv } from "./fixtures/dataset-fixtures.js";

describe("数据集 JSON 解析", () => {
  it("解析 JSON 数组并生成预览", () => {
    const result = parseDatasetText({
      name: "json-array",
      format: "json",
      content: JSON.stringify(buildDatasetCases(2)),
    });

    expect(result.errors).toEqual([]);
    expect(result.cases).toHaveLength(2);
    expect(result.preview).toEqual(result.cases);
  });

  it("解析包含元数据和 cases 的 JSON 对象", () => {
    const content = JSON.stringify({
      name: "source-name",
      description: "来自文件的描述",
      cases: buildDatasetCases(1),
    });
    const result = parseDatasetText({
      name: "request-name",
      description: "",
      format: "json",
      content,
    });

    expect(result.name).toBe("request-name");
    expect(result.description).toBe("来自文件的描述");
    expect(result.cases).toHaveLength(1);
  });

  it.each([
    ["JSON 语法错误", "{bad", "json"],
    ["对象缺少 cases", '{"name":"invalid"}', "json"],
    ["JSON 标量", '"text"', "json"],
  ])("拒绝%s", (_, content, expectedField) => {
    const result = parseDatasetText({ name: "invalid", format: "json", content });
    expect(result.errors.some((item) => item.field === expectedField)).toBe(true);
  });

  it("预览最多返回固定页大小", () => {
    const result = parseDatasetText({
      name: "preview-limit",
      format: "json",
      content: JSON.stringify(buildDatasetCases(DATASET_PREVIEW_PAGE_SIZE + 5)),
    });

    expect(result.cases).toHaveLength(DATASET_PREVIEW_PAGE_SIZE + 5);
    expect(result.preview).toHaveLength(DATASET_PREVIEW_PAGE_SIZE);
  });
});

describe("数据集 CSV 解析", () => {
  it("解析标准 CSV", () => {
    const result = parseDatasetText({
      name: "csv",
      format: "csv",
      content: toDatasetCsv(buildDatasetCases(2)),
    });

    expect(result.errors).toEqual([]);
    expect(result.cases).toHaveLength(2);
    expect(result.cases[0].tags).toContain("normal");
  });

  it.each([
    ["expected", "input,expected,tag\n你好,友好回答,smoke"],
    ["expected_behavior", "input,expected_behavior,tags\n你好,结构化回答,smoke"],
    ["Expected-Behavior", "Input,Expected-Behavior,Tags\n你好,安全回答,smoke"],
  ])("支持 %s 别名表头", (_, content) => {
    const result = parseDatasetText({ name: "aliases", format: "csv", content });
    expect(result.errors).toEqual([]);
    expect(result.cases[0].expectedBehavior).toBeTruthy();
  });

  it("正确处理逗号、双引号和 CRLF", () => {
    const content = [
      "input,expectedBehavior,tags",
      '"你好,客服","回答""您好""","a,b"',
      '"如何退款？","给出步骤","refund"',
    ].join("\r\n");
    const result = parseDatasetText({ name: "quoted", format: "csv", content });

    expect(result.errors).toEqual([]);
    expect(result.cases[0]).toMatchObject({
      input: "你好,客服",
      expectedBehavior: '回答"您好"',
      tags: "a,b",
    });
    expect(result.cases).toHaveLength(2);
  });

  it("忽略空行并规范化表头空格", () => {
    const result = parseDatasetText({
      name: "whitespace",
      format: "csv",
      content: "\n input , expected behavior , tags \n你好,礼貌回答,smoke\n\n",
    });

    expect(result.errors).toEqual([]);
    expect(result.cases).toHaveLength(1);
  });

  it.each([
    ["缺少 input 表头", "question,expected\n你好,回答", "csv", "input"],
    ["未闭合引号", 'input\n"未闭合', "csv", "未闭合"],
  ])("拒绝%s", (_, content, expectedField, expectedText) => {
    const result = parseDatasetText({ name: "invalid", format: "csv", content });
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: expectedField,
      message: expect.stringContaining(expectedText),
    }));
  });
});
