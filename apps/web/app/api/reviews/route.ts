import { approveReview, listReviews, rejectReview, submitReview } from "@promptguard/core";
import { NextResponse } from "next/server";
import { authErrorResponse, requireWebPermission } from "@/lib/auth";
import "@/lib/env";

export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status") as "pending" | "approved" | "rejected" | null;
  return NextResponse.json(await listReviews(status ?? undefined));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "approve") {
      const user = await requireWebPermission("review:decide");
      await approveReview(body.id, user.username, body.comment);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "reject") {
      const user = await requireWebPermission("review:decide");
      await rejectReview(body.id, user.username, body.comment);
      return NextResponse.json({ ok: true });
    }
    const user = await requireWebPermission("review:submit");
    const id = await submitReview({ ...body, submittedBy: user.username });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
