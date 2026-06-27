import { getProjectStatus, pullProjectPrompts, pushProjectPrompts } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getProjectStatus(process.cwd()));
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
