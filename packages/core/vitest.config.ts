import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(packageRoot, "../..");
const artifactRoot = path.join(repositoryRoot, "test-artifacts");

fs.mkdirSync(path.join(artifactRoot, "results"), { recursive: true });

export default defineConfig({
  test: {
    name: "core-unit",
    root: packageRoot,
    include: ["tests/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 15_000,
    reporters: ["default", "json", "junit"],
    outputFile: {
      json: path.join(artifactRoot, "results", "core-unit.json"),
      junit: path.join(artifactRoot, "results", "core-unit-junit.xml"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: path.join(artifactRoot, "coverage"),
      include: [
        "src/services/dataset.ts",
        "src/utils/redaction.ts",
        "src/adapters/llm/mock.ts",
        "test-tools/result-summary.ts",
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
  },
});
