import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getDatabasePath } from "../config.js";
import * as schema from "./schema.js";

const require = createRequire(fileURLToPath(import.meta.url));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3") as new (filename: string) => import("better-sqlite3").Database;

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    dbInstance = drizzle(sqlite, { schema });
  }
  return dbInstance;
}

export function resetDb() {
  dbInstance = null;
}
