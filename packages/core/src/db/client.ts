import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getMysqlConfig } from "../config.js";
import * as schema from "./schema.js";

let poolInstance: mysql.Pool | null = null;

function createDb() {
  return drizzle(getMysqlPool(), { schema, mode: "default" });
}

type DbClient = ReturnType<typeof createDb>;

let dbInstance: DbClient | null = null;

export function getMysqlPool() {
  if (!poolInstance) {
    const config = getMysqlConfig();
    poolInstance = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
      namedPlaceholders: false,
      multipleStatements: false,
    });
  }
  return poolInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance!;
}

export async function closeDb() {
  if (poolInstance) {
    await poolInstance.end();
  }
  poolInstance = null;
  dbInstance = null;
}

export function resetDb() {
  dbInstance = null;
  poolInstance = null;
}
