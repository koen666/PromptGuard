import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { promptVersions } from "../db/schema.js";
import { logAudit } from "./audit.js";

export type PromptVersionStatus =
  | "draft"
  | "versioned"
  | "evaluated"
  | "security_checked"
  | "review_pending"
  | "approved"
  | "gray"
  | "active"
  | "rejected"
  | "rolled_back";

const STATUS_ORDER: Record<PromptVersionStatus, number> = {
  draft: 0,
  versioned: 1,
  evaluated: 2,
  security_checked: 3,
  review_pending: 4,
  approved: 5,
  gray: 6,
  active: 7,
  rejected: 8,
  rolled_back: 8,
};

export function isAtLeastVersionStatus(status: string | null | undefined, required: PromptVersionStatus) {
  const current = (status ?? "versioned") as PromptVersionStatus;
  return (STATUS_ORDER[current] ?? 0) >= STATUS_ORDER[required];
}

export async function setPromptVersionStatus(
  versionId: string,
  status: PromptVersionStatus,
  detail?: string,
) {
  const db = getDb();
  await db.update(promptVersions).set({ status }).where(eq(promptVersions.id, versionId));
  await logAudit({
    action: "version_status_change",
    entityType: "prompt_version",
    entityId: versionId,
    detail: `${status}${detail ? `: ${detail}` : ""}`,
  });
}
