import { listDatasets } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import {
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { DatasetManager } from "./manager";

loadEnv();

export default async function DatasetsPage() {
  const datasets = await listDatasets();

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Benchmark" title="Dataset" titleMuted="数据集" />
        <DatasetManager />
      </TemplatePageWrap>
      <TemplateListSection title="评测数据集" description="管理测试用例，用于自动评测。">
        {datasets.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有数据集</p>
        ) : (
          datasets.map((d, i) => (
            <TemplateListItem
              key={d.id}
              href={`/datasets/${d.id}`}
              index={i}
              icon="solar:database-linear"
              name={d.name}
              sub={`${d.caseCount} 条用例`}
              specs={[
                { label: "描述", value: d.description || "—" },
                { label: "ID", value: d.id.slice(0, 14) + "…" },
                { label: "更新", value: formatDate(d.updatedAt) },
              ]}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}
