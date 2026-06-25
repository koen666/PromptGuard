"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

interface PromptItem {
  id: string;
  name: string;
  versionCount: number;
}

interface ReleaseActionsProps {
  promptId: string;
  currentTrafficPercent?: number;
  compact?: boolean;
}

export function ReleaseActions({ promptId, currentTrafficPercent = 10, compact = false }: ReleaseActionsProps) {
  const router = useRouter();
  const trafficOptions = [20, 35, 50, 75, 100].filter((value) => value > currentTrafficPercent);
  const [trafficPercent, setTrafficPercent] = useState(trafficOptions[0] ?? 100);
  const [note, setNote] = useState("灰度观察指标稳定，提升流量比例");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function postRelease(action: "expand" | "promote" | "rollback", body: Record<string, unknown>) {
    setLoading(action);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "发布操作失败");
      }
      setMessage(action === "rollback" ? "已回滚到稳定版本" : action === "promote" ? "已全量发布" : "已扩容灰度流量");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布操作失败");
    } finally {
      setLoading("");
    }
  }

  async function expand() {
    if (!note.trim()) {
      setError("请填写扩容说明");
      return;
    }
    await postRelease("expand", {
      action: "expand",
      promptId,
      trafficPercent,
      environment: "production",
      note,
    });
  }

  async function promote() {
    if (!note.trim()) {
      setError("请填写全量发布说明");
      return;
    }
    await postRelease("promote", {
      action: "promote",
      promptId,
      environment: "production",
      note,
    });
  }

  async function rollback() {
    const reason = window.prompt("请输入回滚原因", "灰度观察异常，回滚到稳定版本");
    if (!reason?.trim()) return;
    await postRelease("rollback", {
      action: "rollback",
      promptId,
      versionNumber: 1,
      environment: "production",
      reason,
    });
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
          <Button variant="secondary" disabled={!!loading || trafficPercent >= 100} onClick={expand}>
            {loading === "expand" ? "扩容中..." : `扩容到 ${trafficPercent}%`}
          </Button>
          <Button disabled={!!loading} onClick={promote}>
            {loading === "promote" ? "发布中..." : "全量"}
          </Button>
          <Button variant="danger" disabled={!!loading} onClick={rollback}>
            {loading === "rollback" ? "回滚中..." : "回滚"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="min-w-52"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="发布说明"
          />
          <Select className="w-24" value={trafficPercent} onChange={(event) => setTrafficPercent(Number(event.target.value))}>
            {trafficOptions.map((value) => (
              <option key={value} value={value}>{value}%</option>
            ))}
          </Select>
        </div>
        {message && <p className="text-xs text-emerald-300">{message}</p>}
        {error && <p className="max-w-96 text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <Panel>
      <h3 className="text-lg font-semibold text-white">活跃灰度操作</h3>
      <p className="mt-1 text-sm text-white/45">扩容流量、全量发布或回滚当前 production 策略。</p>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px]">
        <div>
          <FieldLabel>发布说明</FieldLabel>
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <div>
          <FieldLabel>目标流量</FieldLabel>
          <Select value={trafficPercent} onChange={(event) => setTrafficPercent(Number(event.target.value))}>
            {trafficOptions.map((value) => (
              <option key={value} value={value}>{value}%</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={!!loading || trafficPercent >= 100} onClick={expand}>
          {loading === "expand" ? "扩容中..." : "扩容灰度"}
        </Button>
        <Button disabled={!!loading} onClick={promote}>
          {loading === "promote" ? "发布中..." : "全量发布"}
        </Button>
        <Button variant="danger" disabled={!!loading} onClick={rollback}>
          {loading === "rollback" ? "回滚中..." : "回滚"}
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </Panel>
  );
}

export function NewReleaseForm({ prompts }: { prompts: PromptItem[] }) {
  const router = useRouter();
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const selectedPrompt = useMemo(() => prompts.find((prompt) => prompt.id === promptId), [promptId, prompts]);
  const [versionNumber, setVersionNumber] = useState(selectedPrompt?.versionCount ?? 1);
  const [trafficPercent, setTrafficPercent] = useState(10);
  const [environment, setEnvironment] = useState("production");
  const [note, setNote] = useState("新版本完成审核，启动小流量灰度验证");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function changePrompt(nextPromptId: string) {
    const nextPrompt = prompts.find((prompt) => prompt.id === nextPromptId);
    setPromptId(nextPromptId);
    setVersionNumber(nextPrompt?.versionCount ?? 1);
  }

  async function startRelease() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, versionNumber, trafficPercent, environment, note }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "创建灰度失败");
      }
      setMessage("灰度发布已创建");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建灰度失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <h3 className="text-lg font-semibold text-white">新建灰度</h3>
      <p className="mt-1 text-sm text-white/45">选择已通过审核和安全门禁的版本，创建 production 灰度策略。</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Prompt</FieldLabel>
          <Select value={promptId} onChange={(event) => changePrompt(event.target.value)}>
            {prompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>{prompt.name} · {prompt.versionCount} 个版本</option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>版本</FieldLabel>
          <Select value={versionNumber} onChange={(event) => setVersionNumber(Number(event.target.value))}>
            {Array.from({ length: selectedPrompt?.versionCount ?? 1 }, (_, index) => (
              <option key={index + 1} value={index + 1}>v{index + 1}</option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>环境</FieldLabel>
          <Input value={environment} onChange={(event) => setEnvironment(event.target.value)} />
        </div>
        <div>
          <FieldLabel>初始流量</FieldLabel>
          <Select value={trafficPercent} onChange={(event) => setTrafficPercent(Number(event.target.value))}>
            {[5, 10, 20, 35, 50, 100].map((value) => (
              <option key={value} value={value}>{value}%</option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <FieldLabel>发布说明</FieldLabel>
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 text-sm">
          {message && <span className="text-emerald-300">{message}</span>}
          {error && <span className="text-red-300">{error}</span>}
        </div>
        <Button onClick={startRelease} disabled={loading || !promptId || !note.trim()}>
          {loading ? "创建中..." : "创建灰度"}
        </Button>
      </div>
    </Panel>
  );
}
