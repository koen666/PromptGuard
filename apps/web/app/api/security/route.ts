import { listSecurityScans, runSecurityScan } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  return NextResponse.json(await listSecurityScans());
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("security:run");
    const body = await request.json();
    const scan = await runSecurityScan(body);
    return NextResponse.json(scan, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
