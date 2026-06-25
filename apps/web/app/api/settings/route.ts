import { getSystemSettings, updateSystemSettings } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  return NextResponse.json(await getSystemSettings());
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireWebPermission("settings:write");
    const body = await request.json();
    const settings = await updateSystemSettings({ ...body, actor: actor.username });
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    if (message === "Invalid provider") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
