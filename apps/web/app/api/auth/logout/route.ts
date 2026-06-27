import { logout } from "@promptguard/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  await logout(await getSessionToken());
  (await cookies()).set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
