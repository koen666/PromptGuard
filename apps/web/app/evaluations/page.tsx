import { listEvaluationComparisons, listEvaluationRuns, listPrompts, listDatasets } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import {
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { EvaluationActions } from "./actions";
import { NewEvaluationForm } from "./new-form";

loadEnv();

export default async function EvaluationsPage() {
  const [runs, comparisons, prompts, datasets] = await Promise.all([
    listEvaluationRuns(),
    listEvaluationComparisons(),
    listPrompts(),
    listDatasets(),
  ]);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="Benchmark"
          title="Eval"
          titleMuted="评测"
        />
        <NewEvaluationForm prompts={prompts} datasets={datasets} />
      </TemplatePageWrap>
      <TemplateListSection title="评测任务" description="对比 Prompt 版本在不同模型下的表现。">
        {runs.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有评测</p>
        ) : (
          runs.map((r, i) => (
            <div key={r.id} className="grid border-b border-white/10 last:border-b-0 md:grid-cols-[1fr_auto]">
              <TemplateListItem
                href={`/reports/${r.id}`}
                index={i}
                icon="solar:chart-2-linear"
                name={r.id.slice(0, 16) + "..."}
                sub={r.status}
                specs={[
                  { label: "均分", value: r.avgScore?.toFixed(2) ?? "-" },
                  { label: "Token", value: String(r.totalTokens ?? 0) },
                  { label: "成本", value: `$${(r.totalCost ?? 0).toFixed(4)}` },
                  { label: "错误", value: r.errorMessage ? r.errorMessage.slice(0, 32) : "-" },
                  { label: "时间", value: formatDate(r.createdAt) },
                ]}
                tier={r.status}
              />
              {r.status === "failed" && (
                <div className="flex items-center justify-start px-4 pb-4 md:justify-end md:pb-0">
                  <EvaluationActions runId={r.id} />
                </div>
              )}
            </div>
          ))
        )}
      </TemplateListSection>
      <TemplateListSection title="版本对比" description="基准版本与候选版本在同一数据集下的差异指标。">
        {comparisons.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有版本对比</p>
        ) : (
          comparisons.map((c, i) => (
            <TemplateListItem
              key={c.id}
              href={`/reports/${c.candidateRunId}`}
              index={i}
              icon="solar:chart-square-linear"
              name={c.id.slice(0, 16) + "..."}
              sub={c.avgScoreDelta >= 0 ? "improved" : "regressed"}
              specs={[
                { label: "均分差", value: signed(c.avgScoreDelta) },
                { label: "通过率差", value: `${signed(c.passRateDelta * 100)}%` },
                { label: "延迟差", value: `${signed(c.latencyDeltaMs)}ms` },
                { label: "退化", value: String(c.regressedCount) },
              ]}
              tier={c.avgScoreDelta >= 0 ? "Pass" : "Fail"}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}
