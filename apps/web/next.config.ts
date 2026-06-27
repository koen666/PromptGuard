import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });

process.env.PROMPTGUARD_ROOT ??= projectRoot;

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "@promptguard/core"],
};

export default nextConfig;
