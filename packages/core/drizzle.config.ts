import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.PROMPTGUARD_DB_HOST ?? process.env.PROMPTGUARD_REMOTE_DB_HOST ?? "127.0.0.1",
    port: Number(process.env.PROMPTGUARD_DB_PORT ?? process.env.PROMPTGUARD_REMOTE_DB_PORT ?? 3306),
    user: process.env.PROMPTGUARD_DB_USER ?? process.env.PROMPTGUARD_REMOTE_DB_USER ?? "root",
    password: process.env.PROMPTGUARD_DB_PASSWORD ?? process.env.PROMPTGUARD_REMOTE_DB_PASSWORD ?? "",
    database: process.env.PROMPTGUARD_DB_NAME ?? process.env.PROMPTGUARD_REMOTE_DB_NAME ?? "PROMPTGUARD",
  },
});
