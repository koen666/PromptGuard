import { listEvaluationRuns, listPrompts, listDatasets } from "@promptguard/core";
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
  const [runs, prompts, datasets] = await Promise.all([
    listEvaluationRuns(),
    listPrompts(),
    listDatasets(),
  ]);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="质量测评"
          title="测评"
          titleMuted="任务"
        />
        <NewEvaluationForm prompts={prompts} datasets={datasets} mode="evaluation" />
      </TemplatePageWrap>
      <TemplateListSection title="测评任务" description="查看提示词版本在数据集上的质量、成本和错误情况。">
        {runs.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有测评</p>
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
                  { label: "Token 数", value: String(r.totalTokens ?? 0) },
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
    </>
  );
}
