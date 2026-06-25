import { getVersionDiff } from "@promptguard/core";
import { NextResponse } from "next/server";
import "@/lib/env";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const from = parseInt(searchParams.get("from") ?? "1");
  const to = parseInt(searchParams.get("to") ?? "2");
  const diff = await getVersionDiff(id, from, to);
  return NextResponse.json(diff);
}
