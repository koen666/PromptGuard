import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getMysqlConfig } from "../config.js";
import * as schema from "./schema.js";

let poolInstance: mysql.Pool | null = null;
let dbInstance: DbClient | null = null;

function createDb() {
  return drizzle(getMysqlPool(), { schema, mode: "default" });
}

type DbClient = ReturnType<typeof createDb>;

const globalDbState = globalThis as typeof globalThis & {
  __promptguardMysqlPool?: mysql.Pool | null;
  __promptguardDb?: DbClient | null;
};

export function getMysqlPool() {
  if (globalDbState.__promptguardMysqlPool) {
    poolInstance = globalDbState.__promptguardMysqlPool;
    return globalDbState.__promptguardMysqlPool;
  }

  if (!poolInstance) {
    const config = getMysqlConfig();
    poolInstance = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: Number(process.env.PROMPTGUARD_DB_CONNECTION_LIMIT ?? 50),
      maxIdle: Number(process.env.PROMPTGUARD_DB_MAX_IDLE ?? 10),
      idleTimeout: Number(process.env.PROMPTGUARD_DB_IDLE_TIMEOUT_MS ?? 60_000),
      enableKeepAlive: true,
      namedPlaceholders: false,
      multipleStatements: false,
    });
    globalDbState.__promptguardMysqlPool = poolInstance;
  }
  return poolInstance;
}

export function getDb() {
  if (globalDbState.__promptguardDb) {
    dbInstance = globalDbState.__promptguardDb;
    return globalDbState.__promptguardDb;
  }

  if (!dbInstance) {
    dbInstance = createDb();
    globalDbState.__promptguardDb = dbInstance;
  }
  return dbInstance!;
}

export async function closeDb() {
  if (poolInstance) {
    await poolInstance.end();
  }
  poolInstance = null;
  dbInstance = null;
  globalDbState.__promptguardMysqlPool = null;
  globalDbState.__promptguardDb = null;
}

export function resetDb() {
  dbInstance = null;
  poolInstance = null;
  globalDbState.__promptguardMysqlPool = null;
  globalDbState.__promptguardDb = null;
}
