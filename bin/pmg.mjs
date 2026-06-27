#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = path.join(rootDir, "apps/cli/dist/index.js");

if (!fs.existsSync(cliEntry)) {
  console.error("pmg is not built yet. Run: pnpm build:pmg");
  process.exit(1);
}

const result = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PROMPTGUARD_ROOT: process.env.PROMPTGUARD_ROOT ?? rootDir,
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
