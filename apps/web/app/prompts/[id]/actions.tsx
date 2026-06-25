"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Panel } from "@/components/template/sections";

interface Version {
  id: string;
  versionNumber: number;
}

export function PromptActions({
  promptId,
  versionNumber,
  versions,
}: {
  promptId: string;
  versionNumber: number;
  versions: Version[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [releaseReason, setReleaseReason] = useState("小流量验证已审核版本");
  const [error, setError] = useState("");

  async function action(type: string, body?: object) {
    setLoading(type);
    setError("");
    try {
      const endpoints: Record<string, { url: string; method?: string }> = {
        review: { url: "/api/reviews", method: "POST" },
        security: { url: "/api/security", method: "POST" },
        gray: { url: "/api/releases", method: "POST" },
      };
      const ep = endpoints[type];
      if (!ep) return;
      const res = await fetch(ep.url, {
        method: ep.method ?? "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "操作失败");
      }
      const payload = await res.json().catch(() => null);
      if (type === "security" && payload?.id) {
        router.push(`/security/${payload.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading("");
    }
  }

  async function rollback(v: number) {
    setLoading("rollback");
    await fetch(`/api/prompts/${promptId}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionNumber: v }),
    });
    router.refresh();
    setLoading("");
  }

  return (
    <Panel>
      <h2 className="text-lg font-semibold text-white">快捷操作</h2>
      <p className="mt-1 text-sm text-white/45">建议顺序：安全扫描、提交审核、灰度发布。</p>
      <div className="mt-4">
        <Input
          value={releaseReason}
          onChange={(e) => setReleaseReason(e.target.value)}
          placeholder="填写灰度发布原因"
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button variant="secondary" disabled={!!loading} onClick={() => action("review", { promptId, versionNumber, comment: "Web submission" })}>
          提交审核
        </Button>
        <Button variant="secondary" disabled={!!loading} onClick={() => action("security", { promptId, versionNumber })}>
          安全扫描
        </Button>
        <Button
          disabled={!!loading || !releaseReason.trim()}
          onClick={() => action("gray", { promptId, versionNumber, trafficPercent: 10, environment: "production", note: releaseReason })}
        >
          灰度 10%
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {versions.length > 1 && (
        <div className="mt-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/40">回滚到版本</p>
          <div className="flex flex-wrap gap-2">
            {versions.slice(1).map((v) => (
              <Button key={v.id} variant="ghost" disabled={!!loading} onClick={() => rollback(v.versionNumber)}>
                v{v.versionNumber}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
