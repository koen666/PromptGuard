import { addTestCase, DatasetImportError, getDataset, getDatasetPage } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  if (url.searchParams.has("page") || url.searchParams.has("pageSize")) {
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const datasetPage = await getDatasetPage(id, page, pageSize);
    if (!datasetPage) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(datasetPage);
  }
  const dataset = await getDataset(id);
  if (!dataset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dataset);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireWebPermission("dataset:write");
    const { id } = await params;
    const body = await request.json();
    const caseId = await addTestCase(id, body);
    return NextResponse.json({ id: caseId });
  } catch (error) {
    if (error instanceof DatasetImportError) {
      return NextResponse.json({ error: error.message, errors: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
