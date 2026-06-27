import Link from "next/link";
import { listPrompts } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Iconify } from "@/components/template/iconify";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";

loadEnv();

export default async function DiffsPage() {
  const prompts = await listPrompts();
  const comparable = prompts.filter((prompt) => prompt.versionCount > 1);
  const versionTotal = prompts.reduce((sum, prompt) => sum + prompt.versionCount, 0);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="Diff"
          title="版本差异对比"
          titleMuted="总览"
          action={
            <Link href="/prompts" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <Iconify icon="solar:archive-linear" width="17" />
              资产库
            </Link>
          }
        />
        <section className="grid gap-3 md:grid-cols-3">
          <DiffStat label="Prompt" value={prompts.length} />
          <DiffStat label="版本总数" value={versionTotal} />
          <DiffStat label="可对比" value={comparable.length} />
        </section>
      </TemplatePageWrap>

      <TemplateListSection title="可对比 Prompt" description="选择 Prompt 后进入版本差异页面。">
        {prompts.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无 Prompt</p>
        ) : (
          prompts.map((prompt, index) => {
            const latest = prompt.versionCount;
            const href = latest > 1 ? `/prompts/${prompt.id}/diff?from=${latest - 1}&to=${latest}` : `/prompts/${prompt.id}`;
            return (
              <TemplateListItem
                key={prompt.id}
                href={href}
                index={index}
                icon="solar:document-text-linear"
                name={prompt.name}
                sub={latest > 1 ? "可对比" : "单版本"}
                specs={[
                  { label: "版本", value: String(latest) },
                  { label: "标签", value: prompt.tags.join(", ") || "-" },
                  { label: "更新", value: formatDate(prompt.updatedAt) },
                ]}
                tier={latest > 1 ? "ready" : "single"}
              />
            );
          })
        )}
      </TemplateListSection>
    </>
  );
}

function DiffStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel>
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </Panel>
  );
}
