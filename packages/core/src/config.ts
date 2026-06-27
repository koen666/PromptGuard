import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type LlmProvider = "mock" | "openai" | "anthropic" | "ollama";
export type OpenAiWireApi = "responses" | "chat_completions";

export type PromptGuardMysqlConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

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

function loadRootEnv(root: string) {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

export function getProjectRoot(): string {
  if (process.env.PROMPTGUARD_ROOT) {
    loadRootEnv(process.env.PROMPTGUARD_ROOT);
    return process.env.PROMPTGUARD_ROOT;
  }
  const root = findMonorepoRoot(process.cwd());
  process.env.PROMPTGUARD_ROOT = root;
  loadRootEnv(root);
  return root;
}

export function getDatabasePath(): string {
  return getDatabaseLabel();
}

export function getMysqlConfig(): PromptGuardMysqlConfig {
  getProjectRoot();
  const host =
    process.env.PROMPTGUARD_DB_HOST ??
    process.env.PROMPTGUARD_REMOTE_DB_HOST ??
    process.env.DB_HOST;
  const port = Number(
    process.env.PROMPTGUARD_DB_PORT ??
    process.env.PROMPTGUARD_REMOTE_DB_PORT ??
    process.env.DB_PORT ??
    3306,
  );
  const user =
    process.env.PROMPTGUARD_DB_USER ??
    process.env.PROMPTGUARD_REMOTE_DB_USER ??
    process.env.DB_USER;
  const password =
    process.env.PROMPTGUARD_DB_PASSWORD ??
    process.env.PROMPTGUARD_REMOTE_DB_PASSWORD ??
    process.env.DB_PASSWORD ??
    "";
  const database =
    process.env.PROMPTGUARD_DB_NAME ??
    process.env.PROMPTGUARD_REMOTE_DB_NAME ??
    process.env.DB_NAME ??
    "PROMPTGUARD";

  if (!host || !user) {
    throw new Error("Missing MySQL config. Set PROMPTGUARD_DB_HOST, PROMPTGUARD_DB_USER, PROMPTGUARD_DB_PASSWORD, and PROMPTGUARD_DB_NAME in .env.");
  }

  return { host, port, user, password, database };
}

export function getDatabaseLabel(): string {
  const config = getMysqlConfig();
  return `mysql://${config.user}@${config.host}:${config.port}/${config.database}`;
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
  const openaiWireApi = process.env.OPENAI_WIRE_API === "chat_completions" ? "chat_completions" : "responses";
  const disableResponseStorage =
    process.env.OPENAI_DISABLE_RESPONSE_STORAGE === "true" ||
    process.env.DISABLE_RESPONSE_STORAGE === "true";
  const openaiFallbackToMock = process.env.OPENAI_FALLBACK_TO_MOCK === "true";

  return {
    provider: getLlmProvider(),
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com",
    openaiWireApi: openaiWireApi as OpenAiWireApi,
    openaiModel: process.env.OPENAI_MODEL ?? process.env.MODEL ?? "gpt-4o-mini",
    openaiReviewModel: process.env.OPENAI_REVIEW_MODEL ?? process.env.REVIEW_MODEL ?? process.env.OPENAI_MODEL ?? process.env.MODEL ?? "gpt-4o-mini",
    openaiReasoningEffort: process.env.OPENAI_REASONING_EFFORT ?? process.env.MODEL_REASONING_EFFORT,
    openaiDisableResponseStorage: disableResponseStorage,
    openaiFallbackToMock,
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022",
    ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  };
}
