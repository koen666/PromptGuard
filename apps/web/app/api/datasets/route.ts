import { createDataset, DatasetImportError, importDatasetText, listDatasets } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET() {
  return NextResponse.json(await listDatasets());
}

export async function POST(request: Request) {
  try {
    await requireWebPermission("dataset:write");
    const body = await request.json();
    const dataset = typeof body.content === "string"
      ? await importDatasetText(body)
      : await createDataset(body);
    return NextResponse.json(dataset, { status: 201 });
  } catch (error) {
    if (error instanceof DatasetImportError) {
      return NextResponse.json({ error: error.message, errors: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
