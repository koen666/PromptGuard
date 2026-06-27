"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function OptimizerActions({
  scanId,
  optimizationId,
  applied,
}: {
  scanId: string;
  optimizationId?: string | null;
  applied?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"draft" | "apply" | null>(null);
  const [error, setError] = useState("");

  async function requestOptimization(apply: boolean) {
    setLoading(apply ? "apply" : "draft");
    setError("");
    try {
      const response = await fetch(`/api/security/${scanId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apply,
          optimizationId: apply ? optimizationId : undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "优化失败");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "优化失败");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <Button variant="secondary" disabled={!!loading} onClick={() => requestOptimization(false)}>
        {loading === "draft" ? "生成中…" : optimizationId ? "重新生成优化草案" : "生成优化草案"}
      </Button>
      <Button disabled={!!loading || applied} onClick={() => requestOptimization(true)}>
        {loading === "apply" ? "保存中…" : applied ? "已保存新版" : "保存为新版提示词"}
      </Button>
      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}
