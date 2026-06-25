import { createUser, listUsers, type RoleName } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  try {
    await requireWebPermission("user:manage");
    return NextResponse.json(await listUsers());
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireWebPermission("user:manage");
    const body = await request.json();
    const user = await createUser({
      username: body.username,
      password: body.password,
      displayName: body.displayName,
      roles: body.roles as RoleName[] | undefined,
      actor: actor.username,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
