import { listEvaluationRuns, retryEvaluationRun, runEvaluation } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  return NextResponse.json(await listEvaluationRuns());
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("evaluation:run");
    const body = await request.json();
    if (body.action === "retry") {
      const run = await retryEvaluationRun(body.id);
      return NextResponse.json(run, { status: 201 });
    }
    const run = await runEvaluation(body);
    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
