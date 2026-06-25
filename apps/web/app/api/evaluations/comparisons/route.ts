import { compareEvaluationVersions, listEvaluationComparisons } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  return NextResponse.json(await listEvaluationComparisons());
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("evaluation:run");
    const body = await request.json();
    const comparison = await compareEvaluationVersions(body);
    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
