import { listAuditLogs } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  try {
    await requireWebPermission("audit:read");
    return NextResponse.json(await listAuditLogs(100));
  } catch (error) {
    return authErrorResponse(error);
  }
}
