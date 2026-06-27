import { createUser, login } from "@promptguard/core";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await createUser({
      username: body.username,
      password: body.password,
      displayName: body.displayName,
      roles: ["engineer"],
      actor: "web_register",
    });
    const result = await login({ username: body.username, password: body.password });
    (await cookies()).set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Register failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
