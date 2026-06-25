"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handle(action: "approve" | "reject") {
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: reviewId, reviewedBy: "reviewer" }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "审核操作失败");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => handle("approve")}>通过</Button>
        <Button variant="danger" onClick={() => handle("reject")}>拒绝</Button>
      </div>
      {error && <p className="max-w-64 text-xs text-red-300">{error}</p>}
    </div>
  );
}
