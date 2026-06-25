import {
  expandGrayRelease,
  listAlertRecords,
  listGrayReleases,
  listMetricSamples,
  listReleaseHistory,
  listRoutePolicies,
  promoteRelease,
  rollbackRelease,
  startGrayRelease,
} from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  const [releases, policies, samples, alerts, history] = await Promise.all([
    listGrayReleases(),
    listRoutePolicies(),
    listMetricSamples(),
    listAlertRecords("open"),
    listReleaseHistory(),
  ]);
  return NextResponse.json({ releases, policies, samples, alerts, history });
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("release:write");
    const body = await request.json();
    if (body.action === "rollback") {
      const prompt = await rollbackRelease(body.promptId, body.versionNumber, body.environment, body.reason);
      return NextResponse.json(prompt);
    }
    if (body.action === "expand") {
      const release = await expandGrayRelease(body);
      return NextResponse.json(release);
    }
    if (body.action === "promote") {
      const release = await promoteRelease(body.promptId, body.environment, body.note);
      return NextResponse.json(release);
    }
    const release = await startGrayRelease(body);
    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
