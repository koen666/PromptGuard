import { desc } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { auditLogs } from "../db/schema.js";
import { createId } from "../utils/id.js";

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId: string;
  actor?: string;
  detail?: string;
}) {
  const db = getDb();
  await db.insert(auditLogs).values({
    id: createId("audit"),
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    actor: params.actor ?? "system",
    detail: params.detail ?? "",
  });
}

export async function listAuditLogs(limit = 50) {
  const db = getDb();
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function exportAuditLogs(format: "json" | "csv" = "json", limit = 500) {
  const logs = await listAuditLogs(limit);
  if (format === "csv") {
    const header = ["id", "action", "entityType", "entityId", "actor", "detail", "createdAt"];
    const rows = logs.map((item) => [
      item.id,
      item.action,
      item.entityType,
      item.entityId,
      item.actor ?? "",
      item.detail ?? "",
      item.createdAt,
    ]);
    return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  }
  return JSON.stringify(logs, null, 2);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
