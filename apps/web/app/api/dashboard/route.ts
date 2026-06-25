import { getDashboardStats, getEvaluationStats, listEvaluationRuns } from "@promptguard/core";
import { NextResponse } from "next/server";
import "@/lib/env";

export async function GET() {
  const [stats, evalStats, recentRuns] = await Promise.all([
    getDashboardStats(),
    getEvaluationStats(),
    listEvaluationRuns(),
  ]);
  return NextResponse.json({
    ...stats,
    ...evalStats,
    recentRuns: recentRuns.slice(0, 5),
  });
}
