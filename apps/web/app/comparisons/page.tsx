import { listEvaluationComparisons, listPrompts, listDatasets } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import {
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { NewEvaluationForm } from "../evaluations/new-form";

loadEnv();

export default async function ComparisonsPage() {
  const [comparisons, prompts, datasets] = await Promise.all([
    listEvaluationComparisons(),
    listPrompts(),
    listDatasets(),
  ]);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="版本回归"
          title="对比"
          titleMuted="差异"
        />
        <NewEvaluationForm prompts={prompts} datasets={datasets} mode="comparison" />
      </TemplatePageWrap>
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
