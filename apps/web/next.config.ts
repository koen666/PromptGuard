import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });

process.env.PROMPTGUARD_ROOT ??= projectRoot;
process.env.DATABASE_URL ??= path.join(projectRoot, "data", "promptguard.db");
if (process.env.DATABASE_URL && !path.isAbsolute(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL = path.resolve(projectRoot, process.env.DATABASE_URL);
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@promptguard/core"],
};

export default nextConfig;
