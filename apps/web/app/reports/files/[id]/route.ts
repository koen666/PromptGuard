import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getReportsDir, listReportRecords } from "@promptguard/core";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportRecord(id);
  if (!report) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileName = path.basename(report.filePath);
  const absPath = path.resolve(getReportsDir(), fileName);
  if (!fs.existsSync(absPath)) {
    return new NextResponse("Report file missing", { status: 404 });
  }

  const body = fs.readFileSync(absPath);
  return new NextResponse(body, {
    headers: {
      "content-type": report.format === "html" ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
      "content-disposition": `inline; filename="${fileName}"`,
    },
  });
}

async function getReportRecord(id: string) {
  const records = await listReportRecords(1000);
  return records.find((record) => record.id === id) ?? null;
}
