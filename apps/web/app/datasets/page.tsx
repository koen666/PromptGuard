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
  const caseTotal = datasets.reduce((sum, dataset) => sum + dataset.caseCount, 0);
  const latestDataset = datasets[0];

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="基准测试" title="数据集" titleMuted="用例" />
        <section className="mb-5 grid gap-3 md:grid-cols-3">
          <DatasetStat label="数据集数量" value={datasets.length} />
          <DatasetStat label="测试用例总数" value={caseTotal} />
          <DatasetStat label="最近更新" value={latestDataset ? formatDate(latestDataset.updatedAt) : "暂无"} />
        </section>
        <DatasetManager />
      </TemplatePageWrap>
      <TemplateListSection title="项目库数据集" description="管理评测样例库，用于自动评测、回归检查和审核证据。">
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

function DatasetStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-2 truncate text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
