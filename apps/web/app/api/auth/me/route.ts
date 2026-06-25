import { getUserBySessionToken } from "@promptguard/core";
import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  const user = await getUserBySessionToken(await getSessionToken());
  return NextResponse.json({ user });
}
