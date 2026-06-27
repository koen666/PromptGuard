import { applyPromptOptimization, runPromptOptimization } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await requireWebPermission(body.apply || body.optimizationId ? "prompt:write" : "security:run");
    const optimization = body.optimizationId
      ? await applyPromptOptimization(body.optimizationId, "web")
      : await runPromptOptimization({ scanId: id, actor: "web", apply: !!body.apply });
    return NextResponse.json(optimization, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
