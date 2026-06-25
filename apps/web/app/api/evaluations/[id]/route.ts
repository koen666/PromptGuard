import { getEvaluationRun } from "@promptguard/core";
import { NextResponse } from "next/server";
import "@/lib/env";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getEvaluationRun(id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}
