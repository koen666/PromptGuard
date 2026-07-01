export interface SuiteSummary {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  success: boolean;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  pct: number;
}

export interface CoverageSummary {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

export interface TestSummary {
  generatedAt: string;
  suites: SuiteSummary[];
  totals: Omit<SuiteSummary, "name" | "success"> & {
    passRate: number;
    success: boolean;
  };
  coverage?: CoverageSummary;
  warnings: string[];
}

interface VitestTestFile {
  assertionResults?: unknown;
  perfStats?: {
    start?: unknown;
    end?: unknown;
  };
}

/**
 * Converts a Vitest JSON report into a stable, tool-independent summary.
 * The function validates every counter so a malformed report cannot be
 * silently presented as a successful test run.
 */
export function summarizeVitestReport(name: string, input: unknown): SuiteSummary {
  if (!isRecord(input)) {
    throw new TypeError(`Report "${name}" must be a JSON object`);
  }

  const total = readCount(input, "numTotalTests");
  const passed = readCount(input, "numPassedTests");
  const failed = readCount(input, "numFailedTests");
  const skipped = readCount(input, "numPendingTests");
  const accounted = passed + failed + skipped;

  if (accounted !== total) {
    throw new Error(
      `Report "${name}" has inconsistent counters: total=${total}, accounted=${accounted}`,
    );
  }

  return {
    name,
    total,
    passed,
    failed,
    skipped,
    durationMs: roundTwo(calculateDuration(input.testResults)),
    success: input.success === true && failed === 0,
  };
}

export function aggregateTestSummaries(
  suites: SuiteSummary[],
  options: {
    generatedAt?: string;
    coverage?: CoverageSummary;
    warnings?: string[];
  } = {},
): TestSummary {
  const base = suites.reduce(
    (totals, suite) => ({
      total: totals.total + suite.total,
      passed: totals.passed + suite.passed,
      failed: totals.failed + suite.failed,
      skipped: totals.skipped + suite.skipped,
      durationMs: totals.durationMs + suite.durationMs,
    }),
    { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
  );

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    suites,
    totals: {
      ...base,
      durationMs: roundTwo(base.durationMs),
      passRate: percentage(base.passed, base.total),
      success: suites.length > 0 && suites.every((suite) => suite.success),
    },
    coverage: options.coverage,
    warnings: options.warnings ?? [],
  };
}

export function parseCoverageSummary(input: unknown): CoverageSummary {
  if (!isRecord(input) || !isRecord(input.total)) {
    throw new TypeError("Coverage summary must contain a total object");
  }

  return {
    statements: readCoverageMetric(input.total, "statements"),
    branches: readCoverageMetric(input.total, "branches"),
    functions: readCoverageMetric(input.total, "functions"),
    lines: readCoverageMetric(input.total, "lines"),
  };
}

export function renderMarkdownSummary(summary: TestSummary): string {
  const lines = [
    "# PromptGuard Core Test Summary",
    "",
    `Generated at: ${summary.generatedAt}`,
    "",
    "## Result",
    "",
    "| Suite | Total | Passed | Failed | Skipped | Duration (ms) | Status |",
    "|---|---:|---:|---:|---:|---:|---|",
    ...summary.suites.map((suite) => [
      escapeMarkdown(suite.name),
      suite.total,
      suite.passed,
      suite.failed,
      suite.skipped,
      suite.durationMs.toFixed(2),
      suite.success ? "PASS" : "FAIL",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |")),
    [
      "**Total**",
      summary.totals.total,
      summary.totals.passed,
      summary.totals.failed,
      summary.totals.skipped,
      summary.totals.durationMs.toFixed(2),
      summary.totals.success ? "**PASS**" : "**FAIL**",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    "",
    `Pass rate: **${summary.totals.passRate.toFixed(2)}%**`,
  ];

  if (summary.coverage) {
    lines.push(
      "",
      "## Coverage",
      "",
      "| Metric | Covered | Total | Percentage |",
      "|---|---:|---:|---:|",
      ...Object.entries(summary.coverage).map(([name, metric]) =>
        `| ${capitalize(name)} | ${metric.covered} | ${metric.total} | ${metric.pct.toFixed(2)}% |`
      ),
    );
  }

  if (summary.warnings.length) {
    lines.push(
      "",
      "## Warnings",
      "",
      ...summary.warnings.map((warning) => `- ${escapeMarkdown(warning)}`),
    );
  }

  lines.push("");
  return lines.join("\n");
}

function readCount(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new TypeError(`${key} must be a non-negative integer`);
  }
  return Number(value);
}

function calculateDuration(testResults: unknown) {
  if (!Array.isArray(testResults)) return 0;

  return testResults.reduce((total, file) => {
    if (!isRecord(file)) return total;
    const typedFile = file as VitestTestFile;
    const assertions = Array.isArray(typedFile.assertionResults)
      ? typedFile.assertionResults
      : [];
    const assertionDuration = assertions.reduce(
      (sum, assertion) =>
        sum + (isRecord(assertion) ? readNonNegativeNumber(assertion.duration) : 0),
      0,
    );
    if (assertionDuration > 0) return total + assertionDuration;

    const start = readNonNegativeNumber(typedFile.perfStats?.start);
    const end = readNonNegativeNumber(typedFile.perfStats?.end);
    return total + Math.max(0, end - start);
  }, 0);
}

function readCoverageMetric(input: Record<string, unknown>, key: string): CoverageMetric {
  const metric = input[key];
  if (!isRecord(metric)) throw new TypeError(`Coverage metric "${key}" is missing`);

  const total = readNonNegativeInteger(metric.total, `${key}.total`);
  const covered = readNonNegativeInteger(metric.covered, `${key}.covered`);
  if (covered > total) {
    throw new Error(`Coverage metric "${key}" has covered > total`);
  }

  return {
    total,
    covered,
    pct: readCoveragePercentage(metric.pct, covered, total, key),
  };
}

function readCoveragePercentage(
  value: unknown,
  covered: number,
  total: number,
  label: string,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0 || value > 100) {
      throw new RangeError(`${label}.pct must be between 0 and 100`);
    }
    return roundTwo(value);
  }
  return percentage(covered, total);
}

function readNonNegativeInteger(value: unknown, label: string) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return Number(value);
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : roundTwo((numerator / denominator) * 100);
}

function roundTwo(value: number) {
  return Number(value.toFixed(2));
}

function escapeMarkdown(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
