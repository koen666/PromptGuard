import { getUserBySessionToken } from "@promptguard/core";
import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserBySessionToken(await getSessionToken());
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return new NextResponse(null, { status: 204 });
}
