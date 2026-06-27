import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { createPrompt, getPrompt, listPrompts, savePromptVersion } from "./prompt.js";
import { findPromptGuardProject, initPromptGuardProject, type PromptGuardProjectConfig } from "../workspace.js";

export type PromptGuardRemoteConfig = {
  name: string;
  provider: "mysql";
  host: string;
  port: number;
  user: string;
  database: string;
  passwordEnv: string;
};

export type PromptGuardTrackedPrompt = {
  id?: string;
  name: string;
};

export type PromptGuardProjectConfigV2 = PromptGuardProjectConfig & {
  project?: {
    id: string;
    name: string;
    description?: string;
    defaultBranch: string;
  };
  remote?: PromptGuardRemoteConfig;
  trackedPrompts?: PromptGuardTrackedPrompt[];
};

export type ProjectPromptReference = {
  name: string;
  file: string;
  line: number;
  kind: "load" | "create";
};

export type ProjectPromptStatus = {
  name: string;
  promptId?: string;
  source?: string;
  line?: number;
  localStatus: "tracked" | "detected" | "missing";
  versionNumber?: number;
  contentHash?: string;
  remoteStatus: "not_configured" | "synced" | "not_pushed" | "changed" | "remote_only" | "error";
  remoteHash?: string;
};

export type ProjectStatus = {
  root: string;
  hasConfig: boolean;
  projectId: string;
  projectName: string;
  remote?: Omit<PromptGuardRemoteConfig, "passwordEnv"> & { passwordEnv: string };
  remoteError?: string;
  prompts: ProjectPromptStatus[];
};

type RemotePromptRow = {
  prompt_id: string;
  name: string;
  active_version_number: number;
  status: string;
  tags_json: string;
  content: string;
  metadata_json: string;
  content_hash: string;
  updated_at: Date;
};

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", "coverage", "__pycache__"]);
const DEFAULT_REMOTE_PASSWORD_ENV = "PROMPTGUARD_REMOTE_DB_PASSWORD";

export function getPromptGuardProjectRoot(startDir = process.cwd()) {
  return findPromptGuardProject(startDir) ?? path.resolve(startDir);
}

export function readProjectConfig(root = getPromptGuardProjectRoot()): PromptGuardProjectConfigV2 | null {
  const configPath = path.join(root, ".promptguard", "promptguard.json");
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as PromptGuardProjectConfigV2;
}

export function writeProjectConfig(root: string, config: PromptGuardProjectConfigV2) {
  const configPath = path.join(root, ".promptguard", "promptguard.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return configPath;
}

export function ensureProjectConfig(input: {
  root?: string;
  name?: string;
  description?: string;
  force?: boolean;
}) {
  const root = path.resolve(input.root ?? process.cwd());
  const initialized = initPromptGuardProject({ root, force: input.force });
  const existing = readProjectConfig(root) ?? (initialized.config as PromptGuardProjectConfigV2);
  const next: PromptGuardProjectConfigV2 = {
    ...existing,
    project: existing.project ?? {
      id: createProjectId(input.name ?? path.basename(root)),
      name: input.name ?? path.basename(root),
      description: input.description,
      defaultBranch: "main",
    },
    trackedPrompts: existing.trackedPrompts ?? [],
  };
  writeProjectConfig(root, next);
  return { ...initialized, config: next };
}

export function configureProjectRemote(input: {
  root?: string;
  name?: string;
  host: string;
  port?: number;
  user: string;
  database: string;
  passwordEnv?: string;
}) {
  const root = getPromptGuardProjectRoot(input.root);
  const project = ensureProjectConfig({ root });
  const config: PromptGuardProjectConfigV2 = {
    ...project.config,
    remote: {
      name: input.name ?? "origin",
      provider: "mysql",
      host: input.host,
      port: input.port ?? 3306,
      user: input.user,
      database: input.database,
      passwordEnv: input.passwordEnv ?? DEFAULT_REMOTE_PASSWORD_ENV,
    },
  };
  writeProjectConfig(root, config);
  return config;
}

export function scanProjectPromptReferences(root = getPromptGuardProjectRoot()): ProjectPromptReference[] {
  const files = listSourceFiles(root);
  const refs: ProjectPromptReference[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const constants = collectStringConstants(content);
    const add = (name: string, index: number, kind: ProjectPromptReference["kind"]) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const relative = path.relative(root, file);
      const line = lineNumberAt(content, index);
      const key = `${trimmed}:${relative}:${line}:${kind}`;
      if (seen.has(key)) return;
      seen.add(key);
      refs.push({ name: trimmed, file: relative, line, kind });
    };

    for (const match of content.matchAll(/GuardedPrompt\.load\(\s*["'`]([^"'`]+)["'`]/g)) {
      add(match[1], match.index ?? 0, "load");
    }

    for (const match of content.matchAll(/GuardedPrompt\.create\(\s*\{[\s\S]{0,800}?\bname\s*:\s*["'`]([^"'`]+)["'`]/g)) {
      add(match[1], match.index ?? 0, "create");
    }

    for (const match of content.matchAll(/GuardedPrompt\.create\(\s*\{[\s\S]{0,800}?\bname\s*:\s*([A-Za-z_$][\w$]*)/g)) {
      const value = constants.get(match[1]);
      if (value) add(value, match.index ?? 0, "create");
    }
  }

  return refs.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

export async function getProjectStatus(rootInput = process.cwd()): Promise<ProjectStatus> {
  const root = getPromptGuardProjectRoot(rootInput);
  const config = readProjectConfig(root);
  const projectName = config?.project?.name ?? path.basename(root);
  const projectId = config?.project?.id ?? createProjectId(projectName);
  const refs = scanProjectPromptReferences(root);
  const localPrompts = await listPrompts();
  const tracked = config?.trackedPrompts ?? [];
  const wantedNames = unique([
    ...refs.map((ref) => ref.name),
    ...tracked.map((prompt) => prompt.name),
  ]);
  const remoteRows = new Map<string, RemotePromptRow>();
  let remoteError: string | undefined;

  if (config?.remote) {
    try {
      const connection = await connectRemote(config.remote);
      await ensureRemoteSchema(connection);
      const [rows] = await connection.execute(
        "SELECT * FROM promptguard_prompt_assets WHERE project_id = ?",
        [projectId],
      );
      await connection.end();
      for (const row of rows as RemotePromptRow[]) {
        remoteRows.set(row.name, row);
        if (!wantedNames.includes(row.name)) wantedNames.push(row.name);
      }
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "Unknown remote error";
    }
  }

  const prompts: ProjectPromptStatus[] = [];
  for (const name of wantedNames) {
    const ref = refs.find((item) => item.name === name);
    const trackedPrompt = tracked.find((item) => item.name === name);
    const local = localPrompts.find((prompt) => prompt.name === name || prompt.id === trackedPrompt?.id);
    const remote = remoteRows.get(name);
    const fullPrompt = local ? await getPrompt(local.id) : null;
    const latestVersion = fullPrompt?.versions[0];
    const contentHash = latestVersion ? hashPromptContent(latestVersion.content) : undefined;
    const remoteStatus = resolveRemoteStatus(config?.remote, remoteError, contentHash, remote?.content_hash);
    prompts.push({
      name,
      promptId: local?.id,
      source: ref?.file,
      line: ref?.line,
      localStatus: local ? (trackedPrompt ? "tracked" : "detected") : "missing",
      versionNumber: latestVersion?.versionNumber,
      contentHash,
      remoteStatus: remote && !local ? "remote_only" : remoteStatus,
      remoteHash: remote?.content_hash,
    });
  }

  return {
    root,
    hasConfig: Boolean(config),
    projectId,
    projectName,
    remote: config?.remote,
    remoteError,
    prompts,
  };
}

export async function pushProjectPrompts(rootInput = process.cwd()) {
  const root = getPromptGuardProjectRoot(rootInput);
  const config = readProjectConfig(root);
  if (!config?.remote) throw new Error("Project remote is not configured. Run: pmg project remote set ...");
  const status = await getProjectStatus(root);
  const localPrompts = await listPrompts();
  const connection = await connectRemote(config.remote);
  await ensureRemoteSchema(connection);
  await upsertRemoteProject(connection, status.projectId, status.projectName, config);

  let pushed = 0;
  for (const item of status.prompts) {
    const prompt = localPrompts.find((entry) => entry.id === item.promptId || entry.name === item.name);
    if (!prompt) continue;
    const latestPrompt = await getPrompt(prompt.id);
    const latest = latestPrompt?.versions[0];
    if (!latest) continue;
    await connection.execute(
      [
        "INSERT INTO promptguard_prompt_assets",
        "(project_id, prompt_id, name, active_version_number, status, tags_json, content, metadata_json, content_hash, updated_at)",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        "ON DUPLICATE KEY UPDATE",
        "prompt_id=VALUES(prompt_id), active_version_number=VALUES(active_version_number), status=VALUES(status),",
        "tags_json=VALUES(tags_json), content=VALUES(content), metadata_json=VALUES(metadata_json),",
        "content_hash=VALUES(content_hash), updated_at=NOW()",
      ].join(" "),
      [
        status.projectId,
        prompt.id,
        prompt.name,
        latest.versionNumber,
        prompt.status,
        JSON.stringify(prompt.tags ?? []),
        latest.content,
        JSON.stringify({ source: "pmg", changelog: latest.changelog }),
        hashPromptContent(latest.content),
      ],
    );
    pushed += 1;
  }

  await connection.end();
  return { pushed, projectId: status.projectId, projectName: status.projectName };
}

export async function pullProjectPrompts(rootInput = process.cwd()) {
  const root = getPromptGuardProjectRoot(rootInput);
  const config = readProjectConfig(root);
  if (!config?.remote) throw new Error("Project remote is not configured. Run: pmg project remote set ...");
  const projectId = config.project?.id ?? createProjectId(config.project?.name ?? path.basename(root));
  const connection = await connectRemote(config.remote);
  await ensureRemoteSchema(connection);
  const [rows] = await connection.execute(
    "SELECT * FROM promptguard_prompt_assets WHERE project_id = ? ORDER BY updated_at DESC",
    [projectId],
  );
  await connection.end();

  const localPrompts = await listPrompts();
  let created = 0;
  let updated = 0;
  for (const row of rows as RemotePromptRow[]) {
    const existing = localPrompts.find((prompt) => prompt.name === row.name);
    if (!existing) {
      await createPrompt({
        name: row.name,
        description: `Pulled from remote project ${config.remote.name}`,
        content: row.content,
        tagNames: safeJsonArray(row.tags_json),
        changelog: "Pulled from remote",
      });
      created += 1;
      continue;
    }
    const prompt = await getPrompt(existing.id);
    const latest = prompt?.versions[0];
    if (latest && hashPromptContent(latest.content) === row.content_hash) continue;
    await savePromptVersion(existing.id, {
      content: row.content,
      changelog: "Pulled from remote",
    });
    updated += 1;
  }

  return { created, updated, pulled: (rows as RemotePromptRow[]).length };
}

function listSourceFiles(root: string) {
  const result: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.name !== ".promptguard") {
        if (entry.name !== ".") continue;
      }
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) visit(absolute);
        continue;
      }
      if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) result.push(absolute);
    }
  };
  visit(root);
  return result;
}

function collectStringConstants(content: string) {
  const constants = new Map<string, string>();
  for (const match of content.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*["'`]([^"'`]+)["'`]/g)) {
    constants.set(match[1], match[2]);
  }
  return constants;
}

function lineNumberAt(content: string, index: number) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function createProjectId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  const hash = crypto.createHash("sha1").update(name).digest("hex").slice(0, 8);
  return `pg_${slug}_${hash}`;
}

function hashPromptContent(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function resolveRemoteStatus(
  remote: PromptGuardRemoteConfig | undefined,
  remoteError: string | undefined,
  localHash: string | undefined,
  remoteHash: string | undefined,
): ProjectPromptStatus["remoteStatus"] {
  if (!remote) return "not_configured";
  if (remoteError) return "error";
  if (!remoteHash) return "not_pushed";
  if (!localHash) return "remote_only";
  return localHash === remoteHash ? "synced" : "changed";
}

async function connectRemote(remote: PromptGuardRemoteConfig) {
  const password = process.env[remote.passwordEnv];
  if (!password) throw new Error(`Missing remote database password env: ${remote.passwordEnv}`);
  const connection = await mysql.createConnection({
    host: remote.host,
    port: remote.port,
    user: remote.user,
    password,
    connectTimeout: 10_000,
    multipleStatements: false,
  });
  await ensureRemoteDatabase(connection, remote.database);
  return connection;
}

async function ensureRemoteDatabase(connection: mysql.Connection, database: string) {
  const databaseName = mysqlIdentifier(database, "database");
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE ${databaseName}`);
}

function mysqlIdentifier(value: string, label: string) {
  if (!/^[A-Za-z0-9_$]+$/.test(value)) {
    throw new Error(`Invalid MySQL ${label} name: ${value}`);
  }
  return `\`${value}\``;
}

async function ensureRemoteSchema(connection: mysql.Connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS promptguard_projects (
      id VARCHAR(160) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      config_json LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS promptguard_prompt_assets (
      project_id VARCHAR(160) NOT NULL,
      prompt_id VARCHAR(160) NOT NULL,
      name VARCHAR(255) NOT NULL,
      active_version_number INT NOT NULL,
      status VARCHAR(64) NOT NULL,
      tags_json LONGTEXT NOT NULL,
      content LONGTEXT NOT NULL,
      metadata_json LONGTEXT NOT NULL,
      content_hash VARCHAR(64) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, name),
      INDEX idx_promptguard_prompt_assets_prompt_id (prompt_id)
    )
  `);
}

async function upsertRemoteProject(
  connection: mysql.Connection,
  projectId: string,
  projectName: string,
  config: PromptGuardProjectConfigV2,
) {
  await connection.execute(
    [
      "INSERT INTO promptguard_projects (id, name, config_json, updated_at)",
      "VALUES (?, ?, ?, NOW())",
      "ON DUPLICATE KEY UPDATE name=VALUES(name), config_json=VALUES(config_json), updated_at=NOW()",
    ].join(" "),
    [projectId, projectName, JSON.stringify({ ...config, remote: config.remote ? { ...config.remote, passwordEnv: config.remote.passwordEnv } : undefined })],
  );
}

function safeJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
