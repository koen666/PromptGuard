import {
  listEvaluationRuns,
  listGrayReleases,
  listReportRecords,
  listSecurityScans,
} from "@promptguard/core";
import { NextResponse } from "next/server";
import "@/lib/env";

export async function GET() {
  const [records, evaluationRuns, securityScans, releases] = await Promise.all([
    listReportRecords(),
    listEvaluationRuns(),
    listSecurityScans(),
    listGrayReleases(),
  ]);

  return NextResponse.json({
    records,
    evaluationRuns,
    securityScans,
    releases,
  });
}
