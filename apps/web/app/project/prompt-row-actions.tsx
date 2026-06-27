"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Iconify } from "@/components/template/iconify";

type OptimizationResult = {
  id: string;
  scanId: string;
  candidateVersionId?: string | null;
};

export function PromptRowActions({
  promptId,
  versionNumber,
}: {
  promptId?: string;
  versionNumber?: number;
}) {
  const router = useRouter();
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState<"optimize" | "save" | null>(null);
  const [error, setError] = useState("");

  async function optimize() {
    if (!promptId || !versionNumber) return;
    setLoading("optimize");
    setError("");
    try {
      const response = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, versionNumber, optimize: true }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "自动优化失败");
      if (!payload?.latestOptimization) throw new Error("没有生成优化草案");
      setOptimization(payload.latestOptimization);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "自动优化失败");
    } finally {
      setLoading(null);
    }
  }

  async function saveVersion() {
    if (!optimization) return;
    setLoading("save");
    setError("");
    try {
      const response = await fetch(`/api/security/${optimization.scanId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimizationId: optimization.id, apply: true }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "保存新版失败");
      setOptimization(payload);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存新版失败");
    } finally {
      setLoading(null);
    }
  }

  const disabled = !promptId || !versionNumber;
  const saved = !!optimization?.candidateVersionId;

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
      {promptId && (
        <Link
          href={`/prompts/${promptId}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-white/50 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          title="查看 Prompt"
        >
          <Iconify icon="solar:eye-linear" width="15" />
        </Link>
      )}
      <button
        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#7067ff]/24 bg-[#7067ff]/12 px-2.5 text-xs font-semibold text-[#c5c0ff] transition hover:border-[#7067ff]/38 hover:bg-[#7067ff]/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled || !!loading}
        title={error || "自动优化"}
        type="button"
        onClick={optimize}
      >
        <Iconify icon="solar:magic-stick-3-linear" width="14" />
        {loading === "optimize" ? "优化中" : optimization ? "重新优化" : "自动优化"}
      </button>
      <button
        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-2.5 text-xs font-semibold text-white/62 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled || !!loading || !optimization || saved}
        title={error || (optimization ? "保存为新版本" : "请先自动优化")}
        type="button"
        onClick={saveVersion}
      >
        <Iconify icon="solar:diskette-linear" width="14" />
        {loading === "save" ? "保存中" : saved ? "已保存" : "保存新版"}
      </button>
    </div>
  );
}
