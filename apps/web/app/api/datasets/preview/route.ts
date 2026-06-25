import { parseDatasetText } from "@promptguard/core";
import { NextResponse } from "next/server";
import "@/lib/env";

export async function POST(request: Request) {
  const body = await request.json();
  const result = parseDatasetText(body);
  return NextResponse.json(result, { status: result.errors.length ? 400 : 200 });
}
