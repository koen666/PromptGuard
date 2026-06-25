import { createPrompt, listPrompts } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  const prompts = await listPrompts();
  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("prompt:write");
    const body = await request.json();
    const prompt = await createPrompt(body);
    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
