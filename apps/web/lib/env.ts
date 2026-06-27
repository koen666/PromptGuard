import fs from "node:fs";
import path from "node:path";

function findMonorepoRoot(start = process.cwd()): string {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start, "../..");
}

export function loadEnv() {
  const root = process.env.PROMPTGUARD_ROOT ?? findMonorepoRoot();
  process.env.PROMPTGUARD_ROOT = root;

  const configured = process.env.DATABASE_URL?.trim();
  const dbPath = configured
    ? path.isAbsolute(configured)
      ? configured
      : path.resolve(root, configured)
    : path.join(root, "data", "promptguard.db");

  process.env.DATABASE_URL = dbPath;
}

loadEnv();
