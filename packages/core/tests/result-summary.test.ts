import { describe, expect, it } from "vitest";
import {
  aggregateTestSummaries,
  parseCoverageSummary,
  renderMarkdownSummary,
  summarizeVitestReport,
  type SuiteSummary,
} from "../test-tools/result-summary.js";

function vitestReport(overrides: Record<string, unknown> = {}) {
  return {
    numTotalTests: 4,
    numPassedTests: 3,
    numFailedTests: 0,
    numPendingTests: 1,
    success: true,
    testResults: [
      {
        assertionResults: [
          { status: "passed", duration: 12 },
          { status: "passed", duration: 8 },
          { status: "passed", duration: 5 },
          { status: "pending" },
        ],
      },
    ],
    ...overrides,
  };
}

describe("Vitest 结果标准化", () => {
  it("读取计数、状态和断言耗时", () => {
    expect(summarizeVitestReport("core", vitestReport())).toEqual({
      name: "core",
      total: 4,
      passed: 3,
      failed: 0,
      skipped: 1,
      durationMs: 25,
      success: true,
    });
  });

  it("断言耗时缺失时使用文件性能时间", () => {
    const report = vitestReport({
      testResults: [{ assertionResults: [], perfStats: { start: 100, end: 145 } }],
    });
    expect(summarizeVitestReport("core", report).durationMs).toBe(45);
  });

  it("忽略损坏或负数的断言耗时", () => {
    const report = vitestReport({
      testResults: [{
        assertionResults: [null, { duration: -1 }, { duration: 12.345 }],
      }],
    });
    expect(summarizeVitestReport("core", report).durationMs).toBe(12.35);
  });

  it("失败计数会覆盖错误的 success 标记", () => {
    const report = vitestReport({
      numPassedTests: 2,
      numFailedTests: 1,
      success: true,
    });
    expect(summarizeVitestReport("core", report).success).toBe(false);
  });

  it.each([
    ["非对象", null],
    ["负数计数", vitestReport({ numTotalTests: -1 })],
    ["小数计数", vitestReport({ numPassedTests: 1.5 })],
    ["计数不一致", vitestReport({ numTotalTests: 5 })],
  ])("拒绝%s报告", (_, report) => {
    expect(() => summarizeVitestReport("invalid", report)).toThrow();
  });
});

describe("测试汇总", () => {
  const suites: SuiteSummary[] = [
    {
      name: "unit",
      total: 10,
      passed: 10,
      failed: 0,
      skipped: 0,
      durationMs: 100,
      success: true,
    },
    {
      name: "security",
      total: 5,
      passed: 4,
      failed: 0,
      skipped: 1,
      durationMs: 50,
      success: true,
    },
  ];

  it("汇总套件并计算两位小数通过率", () => {
    const summary = aggregateTestSummaries(suites, {
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(summary.totals).toEqual({
      total: 15,
      passed: 14,
      failed: 0,
      skipped: 1,
      durationMs: 150,
      passRate: 93.33,
      success: true,
    });
  });

  it("没有套件时不会错误报告成功", () => {
    const summary = aggregateTestSummaries([]);
    expect(summary.totals).toMatchObject({ total: 0, passRate: 0, success: false });
  });

  it("任一套件失败时总体失败", () => {
    const failedSuite = { ...suites[0], failed: 1, passed: 9, success: false };
    const summary = aggregateTestSummaries([failedSuite, suites[1]]);
    expect(summary.totals.success).toBe(false);
    expect(summary.totals.failed).toBe(1);
  });
});

describe("覆盖率与 Markdown 报告", () => {
  const coverageInput = {
    total: {
      statements: { total: 100, covered: 88, pct: 88 },
      branches: { total: 40, covered: 30, pct: 75 },
      functions: { total: 20, covered: 18, pct: 90 },
      lines: { total: 90, covered: 81, pct: 90 },
    },
  };

  it("百分比缺失时从覆盖数重新计算", () => {
    const input = structuredClone(coverageInput);
    delete (input.total.statements as { pct?: number }).pct;
    const coverage = parseCoverageSummary(input);
    expect(coverage.statements).toEqual({ total: 100, covered: 88, pct: 88 });
    expect(coverage.branches.pct).toBe(75);
  });

  it("保留覆盖率工具提供的官方小数结果", () => {
    const coverage = parseCoverageSummary({
      total: {
        ...coverageInput.total,
        functions: { total: 56, covered: 45, pct: 80.35 },
      },
    });
    expect(coverage.functions.pct).toBe(80.35);
  });

  it("拒绝 covered 大于 total 的覆盖率", () => {
    const invalid = structuredClone(coverageInput);
    invalid.total.lines.covered = 91;
    expect(() => parseCoverageSummary(invalid)).toThrow("covered > total");
  });

  it("拒绝超出 0 到 100 的官方百分比", () => {
    const invalid = structuredClone(coverageInput);
    invalid.total.lines.pct = 101;
    expect(() => parseCoverageSummary(invalid)).toThrow("between 0 and 100");
  });

  it("生成包含结果、覆盖率和警告的 Markdown", () => {
    const coverage = parseCoverageSummary(coverageInput);
    const summary = aggregateTestSummaries([
      {
        name: "core|unit",
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        durationMs: 12.345,
        success: true,
      },
    ], {
      generatedAt: "2026-07-01T00:00:00.000Z",
      coverage,
      warnings: ["optional.json: file not found"],
    });
    const markdown = renderMarkdownSummary(summary);

    expect(markdown).toContain("# PromptGuard Core Test Summary");
    expect(markdown).toContain("core\\|unit");
    expect(markdown).toContain("100.00%");
    expect(markdown).toContain("Statements");
    expect(markdown).toContain("optional.json: file not found");
  });
});
