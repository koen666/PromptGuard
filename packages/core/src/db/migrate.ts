import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { getDatabasePath } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");

  const migrationsDir = path.resolve(__dirname, "../../drizzle");
  if (!fs.existsSync(migrationsDir)) {
    console.error("No migrations found. Run: pnpm db:generate");
    process.exit(1);
  }

  const journalPath = path.join(migrationsDir, "meta/_journal.json");
  if (!fs.existsSync(journalPath)) {
    console.error("Migration journal not found.");
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as {
    entries: Array<{ tag: string }>;
  };

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  const applied = new Set(
    sqlite.prepare("SELECT hash FROM __drizzle_migrations").all().map((r) => (r as { hash: string }).hash),
  );

  for (const entry of journal.entries) {
    if (applied.has(entry.tag)) continue;
    const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, "utf-8");
    const statements = sql.split("--> statement-breakpoint");
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
    sqlite.prepare("INSERT INTO __drizzle_migrations (hash) VALUES (?)").run(entry.tag);
    console.log(`Applied migration: ${entry.tag}`);
  }

  sqlite.close();
  console.log("Migrations complete.");
}
