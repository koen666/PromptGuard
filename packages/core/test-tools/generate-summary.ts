import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateTestSummaries,
  parseCoverageSummary,
  renderMarkdownSummary,
  summarizeVitestReport,
  type CoverageSummary,
  type SuiteSummary,
} from "./result-summary.js";

interface CliOptions {
  resultsDir: string;
  coverageFile: string;
  outputDir: string;
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(packageRoot, "../..");

main();

function main() {
  const options = parseArguments(process.argv.slice(2));
  const warnings: string[] = [];
  const suites = loadTestReports(options.resultsDir, warnings);
  if (!suites.length) {
    throw new Error(`No valid Vitest JSON reports found in ${options.resultsDir}`);
  }

  const coverage = loadCoverage(options.coverageFile, warnings);
  const summary = aggregateTestSummaries(suites, { coverage, warnings });
  fs.mkdirSync(options.outputDir, { recursive: true });

  const jsonPath = path.join(options.outputDir, "test-summary.json");
  const markdownPath = path.join(options.outputDir, "test-summary.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  fs.writeFileSync(markdownPath, renderMarkdownSummary(summary), "utf-8");

  console.log(`Test summary JSON: ${jsonPath}`);
  console.log(`Test summary Markdown: ${markdownPath}`);
  console.log(
    `${summary.totals.passed}/${summary.totals.total} passed `
      + `(${summary.totals.passRate.toFixed(2)}%)`,
  );
  if (!summary.totals.success) process.exitCode = 1;
}

function loadTestReports(resultsDir: string, warnings: string[]): SuiteSummary[] {
  if (!fs.existsSync(resultsDir)) return [];

  const candidates = fs.readdirSync(resultsDir)
    .filter((name) => name.endsWith(".json") && !name.includes("summary"))
    .sort();

  const suites: SuiteSummary[] = [];
  for (const filename of candidates) {
    const filePath = path.join(resultsDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
      suites.push(summarizeVitestReport(path.basename(filename, ".json"), data));
    } catch (error) {
      warnings.push(`${filename}: ${errorMessage(error)}`);
    }
  }
  return suites;
}

function loadCoverage(coverageFile: string, warnings: string[]): CoverageSummary | undefined {
  if (!fs.existsSync(coverageFile)) {
    warnings.push(`Coverage file not found: ${coverageFile}`);
    return undefined;
  }

  try {
    return parseCoverageSummary(
      JSON.parse(fs.readFileSync(coverageFile, "utf-8")) as unknown,
    );
  } catch (error) {
    warnings.push(`Coverage: ${errorMessage(error)}`);
    return undefined;
  }
}

function parseArguments(args: string[]): CliOptions {
  const defaults: CliOptions = {
    resultsDir: path.join(repositoryRoot, "test-artifacts", "results"),
    coverageFile: path.join(
      repositoryRoot,
      "test-artifacts",
      "coverage",
      "coverage-summary.json",
    ),
    outputDir: path.join(repositoryRoot, "test-artifacts", "summary"),
  };

  const options = { ...defaults };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (!value) throw new Error(`Missing value for ${argument}`);

    if (argument === "--results-dir") options.resultsDir = path.resolve(value);
    else if (argument === "--coverage-file") options.coverageFile = path.resolve(value);
    else if (argument === "--output-dir") options.outputDir = path.resolve(value);
    else throw new Error(`Unknown argument: ${argument}`);
    index += 1;
  }
  return options;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
