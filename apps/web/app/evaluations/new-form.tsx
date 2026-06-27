"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

interface PromptItem {
  id: string;
  name: string;
  versionCount: number;
}
interface DatasetItem {
  id: string;
  name: string;
  caseCount: number;
}

export function NewEvaluationForm({
  prompts,
  datasets,
}: {
  prompts: PromptItem[];
  datasets: DatasetItem[];
}) {
  const router = useRouter();
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const [versionNumber, setVersionNumber] = useState(1);
  const [comparePromptId, setComparePromptId] = useState(prompts[0]?.id ?? "");
  const [baselineVersionNumber, setBaselineVersionNumber] = useState(1);
  const [candidateVersionNumber, setCandidateVersionNumber] = useState(prompts[0]?.versionCount ?? 1);
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [compareDatasetId, setCompareDatasetId] = useState(datasets[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"run" | "compare" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedVersionCount = prompts.find((p) => p.id === promptId)?.versionCount ?? 1;
  const selectedCompareVersionCount = prompts.find((p) => p.id === comparePromptId)?.versionCount ?? 1;

  useEffect(() => {
    setVersionNumber(1);
  }, [promptId]);

  useEffect(() => {
    setBaselineVersionNumber(1);
    setCandidateVersionNumber(selectedCompareVersionCount);
  }, [comparePromptId, selectedCompareVersionCount]);

  async function handleRun() {
    setLoading(true);
    setLoadingMode("run");
    setMessage("评测正在运行，完成后会自动打开报告。");
    setError("");
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, versionNumber, datasetId }),
      });
      const run = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(run?.error ?? "评测失败");
      }
      setMessage("评测完成，正在打开报告。");
      router.push(`/reports/${run.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "评测失败");
      setMessage("");
    } finally {
      setLoading(false);
      setLoadingMode("");
    }
  }

  async function handleCompare() {
    setLoading(true);
    setLoadingMode("compare");
    setMessage("版本对比正在运行，完成后会自动打开候选版本报告。");
    setError("");
    try {
      const response = await fetch("/api/evaluations/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: comparePromptId, baselineVersionNumber, candidateVersionNumber, datasetId: compareDatasetId }),
      });
      const comparison = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(comparison?.error ?? "对比失败");
      }
      setMessage("对比完成，正在打开候选版本报告。");
      router.push(`/reports/${comparison.candidateRunId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "对比失败");
      setMessage("");
    } finally {
      setLoading(false);
      setLoadingMode("");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h3 className="text-lg font-semibold text-white">单版本评测</h3>
        <p className="mt-1 text-sm text-white/45">选择提示词版本和数据集，系统会运行模拟模型并生成报告。</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>提示词</FieldLabel>
            <PromptSelect prompts={prompts} promptId={promptId} setPromptId={setPromptId} />
          </div>
          <div>
            <FieldLabel>版本</FieldLabel>
            <VersionSelect value={versionNumber} onChange={setVersionNumber} count={selectedVersionCount} />
          </div>
          <div>
            <FieldLabel>数据集</FieldLabel>
            <DatasetSelect datasets={datasets} datasetId={datasetId} setDatasetId={setDatasetId} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleRun} disabled={loading || !promptId || !datasetId}>
              {loadingMode === "run" ? "运行中..." : "开始评测"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <h3 className="text-lg font-semibold text-white">新旧版本对比</h3>
        <p className="mt-1 text-sm text-white/45">同一数据集下比较基准版本和候选版本的分数、通过率和延迟。</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>提示词</FieldLabel>
            <PromptSelect prompts={prompts} promptId={comparePromptId} setPromptId={setComparePromptId} />
          </div>
          <div>
            <FieldLabel>基准版本</FieldLabel>
            <VersionSelect value={baselineVersionNumber} onChange={setBaselineVersionNumber} count={selectedCompareVersionCount} />
          </div>
          <div>
            <FieldLabel>候选版本</FieldLabel>
            <VersionSelect value={candidateVersionNumber} onChange={setCandidateVersionNumber} count={selectedCompareVersionCount} />
          </div>
          <div>
            <FieldLabel>数据集</FieldLabel>
            <DatasetSelect datasets={datasets} datasetId={compareDatasetId} setDatasetId={setCompareDatasetId} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCompare} disabled={loading || !comparePromptId || !compareDatasetId || baselineVersionNumber === candidateVersionNumber}>
              {loadingMode === "compare" ? "对比中..." : "开始对比"}
            </Button>
          </div>
        </div>
      </Panel>
      {(message || error) && (
        <div className="lg:col-span-2">
          <Panel className={error ? "border-red-400/20 bg-red-500/10" : "border-emerald-400/20 bg-emerald-500/10"}>
            <p className={error ? "text-sm text-red-200" : "text-sm text-emerald-200"}>{error || message}</p>
          </Panel>
        </div>
      )}
    </div>
  );
}

function PromptSelect({ prompts, promptId, setPromptId }: { prompts: PromptItem[]; promptId: string; setPromptId: (value: string) => void }) {
  return (
    <Select value={promptId} onChange={(e) => setPromptId(e.target.value)}>
      {prompts.map((p) => (
        <option key={p.id} value={p.id}>{p.name} · {p.versionCount} 个版本</option>
      ))}
    </Select>
  );
}

function DatasetSelect({ datasets, datasetId, setDatasetId }: { datasets: DatasetItem[]; datasetId: string; setDatasetId: (value: string) => void }) {
  return (
    <Select value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
      {datasets.map((d) => (
        <option key={d.id} value={d.id}>{d.name} · {d.caseCount} 条用例</option>
      ))}
    </Select>
  );
}

function VersionSelect({ value, count, onChange }: { value: number; count: number; onChange: (value: number) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(parseInt(e.target.value))}>
      {Array.from({ length: count }, (_, i) => (
        <option key={i + 1} value={i + 1}>v{i + 1}</option>
      ))}
    </Select>
  );
}
