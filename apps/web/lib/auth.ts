import { requirePermission, type Permission } from "@promptguard/core";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-constants";

export { SESSION_COOKIE };

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function requireWebPermission(permission: Permission) {
  return requirePermission(await getSessionToken(), permission);
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permission denied";
  const status = message === "Authentication required" ? 401 : 403;
  return Response.json({ error: message }, { status });
}
