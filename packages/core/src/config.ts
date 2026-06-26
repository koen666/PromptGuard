import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type LlmProvider = "mock" | "openai" | "anthropic" | "ollama";

function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(__dirname, "../../..");
}

export function getProjectRoot(): string {
  if (process.env.PROMPTGUARD_ROOT) {
    return process.env.PROMPTGUARD_ROOT;
  }
  return findMonorepoRoot(process.cwd());
}

export function getDatabasePath(): string {
  const root = getProjectRoot();
  const envPath = process.env.DATABASE_URL?.trim();
  const dbPath = envPath
    ? path.isAbsolute(envPath)
      ? envPath
      : path.resolve(root, envPath)
    : path.resolve(root, "data/promptguard.db");

  if (!dbPath) {
    throw new Error("Failed to resolve database path");
  }
  return dbPath;
}

export function getReportsDir(): string {
  return path.resolve(getProjectRoot(), "reports");
}

export function getLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER ?? "mock";
  if (provider === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (provider === "ollama") return "ollama";
  return "mock";
}

export function getLlmConfig() {
  return {
    provider: getLlmProvider(),
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022",
    ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  };
}
