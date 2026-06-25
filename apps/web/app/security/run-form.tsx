"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

interface PromptItem {
  id: string;
  name: string;
  versionCount: number;
}

export function SecurityRunForm({ prompts }: { prompts: PromptItem[] }) {
  const router = useRouter();
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [versionNumber, setVersionNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = prompts.find((p) => p.id === promptId);

  async function runScan() {
    setLoading(true);
    setMessage("安全扫描正在运行，完成后会自动打开详情。");
    setError("");
    try {
      const response = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, versionNumber }),
      });
      const scan = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(scan?.error ?? "安全扫描失败");
      }
      setMessage("安全扫描完成，正在打开详情。");
      router.push(`/security/${scan.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "安全扫描失败");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mt-4">
      <div className="grid gap-4 md:grid-cols-4">
      <div>
        <FieldLabel>Prompt</FieldLabel>
        <Select value={promptId} onChange={(e) => setPromptId(e.target.value)}>
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FieldLabel>版本</FieldLabel>
        <Select value={versionNumber} onChange={(e) => setVersionNumber(parseInt(e.target.value))}>
          {Array.from({ length: selected?.versionCount ?? 1 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              v{i + 1}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end">
        <Button onClick={runScan} disabled={loading || !promptId}>
          {loading ? "扫描中…" : "开始扫描"}
        </Button>
      </div>
      </div>
      {(message || error) && (
        <p className={`mt-4 text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
          {error || message}
        </p>
      )}
    </Panel>
  );
}
