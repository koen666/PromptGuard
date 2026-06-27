import { getProjectStatus, pullProjectPrompts, pushProjectPrompts } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export const runtime = "nodejs";

function projectSlugFromSource(source?: string) {
  const parts = source?.split("/") ?? [];
  if (parts[0] === "pre" && parts[1]) return parts[1];
  return "workspace";
}

function projectNameFromSlug(slug: string) {
  const names: Record<string, string> = {
    "support-chat-system": "售后对话系统",
    "order-risk-system": "订单风控系统",
    "knowledge-base-assistant": "知识库问答助手",
    workspace: "当前工作区",
  };
  return names[slug] ?? slug;
}

export async function GET() {
  try {
    const status = await getProjectStatus(process.cwd());
    const grouped = new Map<string, typeof status.prompts>();
    for (const prompt of status.prompts) {
      const slug = projectSlugFromSource(prompt.source);
      grouped.set(slug, [...(grouped.get(slug) ?? []), prompt]);
    }

    return NextResponse.json({
      ...status,
      projects: Array.from(grouped.entries()).map(([slug, prompts]) => ({
        slug,
        name: projectNameFromSlug(slug),
        promptCount: prompts.length,
        prompts,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("prompt:write");
    const body = await request.json().catch(() => ({}));
    if (body.action === "pull") {
      return NextResponse.json(await pullProjectPrompts(process.cwd()));
    }
    if (body.action === "push") {
      return NextResponse.json(await pushProjectPrompts(process.cwd()));
    }
    return NextResponse.json({ error: "Unsupported project action" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
