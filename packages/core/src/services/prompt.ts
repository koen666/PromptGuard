import { createTwoFilesPatch } from "diff";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { promptTags, prompts, promptVersions, tags } from "../db/schema.js";
import { createId } from "../utils/id.js";
import { findSensitiveText } from "../utils/redaction.js";
import { logAudit } from "./audit.js";

export async function listPrompts() {
  const db = getDb();
  const allPrompts = await db.select().from(prompts).orderBy(desc(prompts.updatedAt));
  const result = [];
  for (const p of allPrompts) {
    const versionCount = await db.select().from(promptVersions).where(eq(promptVersions.promptId, p.id));
    const tagRows = await db
      .select({ name: tags.name })
      .from(promptTags)
      .innerJoin(tags, eq(promptTags.tagId, tags.id))
      .where(eq(promptTags.promptId, p.id));
    result.push({
      ...p,
      versionCount: versionCount.length,
      tags: tagRows.map((t) => t.name),
    });
  }
  return result;
}

export async function getPrompt(id: string) {
  const db = getDb();
  const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
  if (!prompt) return null;
  const versions = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, id))
    .orderBy(desc(promptVersions.versionNumber));
  const tagRows = await db
    .select({ name: tags.name })
    .from(promptTags)
    .innerJoin(tags, eq(promptTags.tagId, tags.id))
    .where(eq(promptTags.promptId, id));
  return { ...prompt, versions, tags: tagRows.map((t) => t.name) };
}

export async function createPrompt(input: {
  name: string;
  description?: string;
  content: string;
  tagNames?: string[];
  changelog?: string;
}) {
  const db = getDb();
  const promptId = createId("prompt");
  const versionId = createId("pver");

  await db.insert(prompts).values({
    id: promptId,
    name: input.name,
    description: input.description ?? "",
    status: "draft",
    activeVersionId: versionId,
  });

  await db.insert(promptVersions).values({
    id: versionId,
    promptId,
    versionNumber: 1,
    content: input.content,
    changelog: input.changelog ?? "Initial version",
  });

  if (input.tagNames?.length) {
    await syncPromptTags(promptId, input.tagNames);
  }

  await logAudit({
    action: "create",
    entityType: "prompt",
    entityId: promptId,
    detail: input.name,
  });
  await auditPromptSensitivity(versionId, input.content);

  return getPrompt(promptId);
}

export async function updatePrompt(
  id: string,
  input: { name?: string; description?: string; status?: "draft" | "active" | "archived"; tagNames?: string[] },
) {
  const db = getDb();
  const existing = await getPrompt(id);
  if (!existing) throw new Error("Prompt not found");

  await db
    .update(prompts)
    .set({
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(prompts.id, id));

  if (input.tagNames) {
    await syncPromptTags(id, input.tagNames);
  }

  await logAudit({ action: "update", entityType: "prompt", entityId: id });
  return getPrompt(id);
}

export async function savePromptVersion(
  promptId: string,
  input: { content: string; changelog?: string },
) {
  const db = getDb();
  const existing = await getPrompt(promptId);
  if (!existing) throw new Error("Prompt not found");

  const latest = existing.versions[0];
  if (latest && latest.content === input.content) {
    return existing;
  }

  const nextVersion = (latest?.versionNumber ?? 0) + 1;
  const versionId = createId("pver");

  await db.insert(promptVersions).values({
    id: versionId,
    promptId,
    versionNumber: nextVersion,
    content: input.content,
    changelog: input.changelog ?? `Version ${nextVersion}`,
  });

  await db
    .update(prompts)
    .set({ activeVersionId: versionId, updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, promptId));

  await logAudit({
    action: "version_create",
    entityType: "prompt_version",
    entityId: versionId,
    detail: `v${nextVersion}`,
  });
  await auditPromptSensitivity(versionId, input.content);

  return getPrompt(promptId);
}

async function auditPromptSensitivity(versionId: string, content: string) {
  const findings = findSensitiveText(content);
  if (!findings.length) return;
  await logAudit({
    action: "prompt_sensitive_content_detected",
    entityType: "prompt_version",
    entityId: versionId,
    detail: findings.map((finding) => finding.name).join(", "),
  });
}

export async function getVersionDiff(promptId: string, fromVersion: number, toVersion: number) {
  const prompt = await getPrompt(promptId);
  if (!prompt) throw new Error("Prompt not found");
  const from = prompt.versions.find((v) => v.versionNumber === fromVersion);
  const to = prompt.versions.find((v) => v.versionNumber === toVersion);
  if (!from || !to) throw new Error("Version not found");

  const patch = createTwoFilesPatch(
    `v${fromVersion}`,
    `v${toVersion}`,
    from.content,
    to.content,
    undefined,
    undefined,
    { context: 3 },
  );

  return { from, to, patch };
}

export async function rollbackPrompt(promptId: string, versionNumber: number) {
  const prompt = await getPrompt(promptId);
  if (!prompt) throw new Error("Prompt not found");
  const target = prompt.versions.find((v) => v.versionNumber === versionNumber);
  if (!target) throw new Error("Version not found");

  const db = getDb();
  await db
    .update(prompts)
    .set({ activeVersionId: target.id, updatedAt: new Date().toISOString() })
    .where(eq(prompts.id, promptId));

  await logAudit({
    action: "rollback",
    entityType: "prompt",
    entityId: promptId,
    detail: `Rolled back to v${versionNumber}`,
  });

  return getPrompt(promptId);
}

async function syncPromptTags(promptId: string, tagNames: string[]) {
  const db = getDb();
  await db.delete(promptTags).where(eq(promptTags.promptId, promptId));

  for (const name of tagNames) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) continue;
    let [tag] = await db.select().from(tags).where(eq(tags.name, normalized));
    if (!tag) {
      const tagId = createId("tag");
      await db.insert(tags).values({ id: tagId, name: normalized });
      tag = { id: tagId, name: normalized };
    }
    await db.insert(promptTags).values({ promptId, tagId: tag.id });
  }
}

export async function getPromptVersionByNumber(promptId: string, versionNumber: number) {
  const db = getDb();
  const [version] = await db
    .select()
    .from(promptVersions)
    .where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, versionNumber)));
  return version ?? null;
}

export async function getPromptVersion(id: string) {
  const db = getDb();
  const [version] = await db.select().from(promptVersions).where(eq(promptVersions.id, id));
  return version ?? null;
}
