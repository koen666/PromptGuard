import { getPrompt, savePromptVersion, updatePrompt } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = await getPrompt(id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireWebPermission("prompt:write");
    const { id } = await params;
    const body = await request.json();
    if (body.content) {
      const prompt = await savePromptVersion(id, { content: body.content, changelog: body.changelog });
      return NextResponse.json(prompt);
    }
    const prompt = await updatePrompt(id, body);
    return NextResponse.json(prompt);
  } catch (error) {
    return authErrorResponse(error);
  }
}
