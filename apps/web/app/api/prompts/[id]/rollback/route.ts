import { rollbackPrompt } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireWebPermission("release:write");
    const { id } = await params;
    const { versionNumber } = await request.json();
    const prompt = await rollbackPrompt(id, versionNumber);
    return NextResponse.json(prompt);
  } catch (error) {
    return authErrorResponse(error);
  }
}
