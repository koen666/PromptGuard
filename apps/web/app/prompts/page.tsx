import { listDatasets, listPrompts, listReviews, listSecurityScans } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import {
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { CreatePromptForm } from "./create-form";
import { PromptLibraryList } from "./prompt-library-list";

loadEnv();

export default async function PromptsPage() {
  const [prompts, datasets, reviews, scans] = await Promise.all([
    listPrompts(),
    listDatasets(),
    listReviews(),
    listSecurityScans(),
  ]);
  const versionTotal = prompts.reduce((sum, prompt) => sum + prompt.versionCount, 0);
  const pendingReviews = reviews.filter((review) => review.status === "pending").length;
  const riskScans = scans.filter((scan) => scan.passed === false).length;

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="资产"
          title="提示词"
          titleMuted="资产"
        />
        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <LibraryStat label="Prompt" value={prompts.length} />
          <LibraryStat label="版本总数" value={versionTotal} />
          <LibraryStat label="Dataset" value={datasets.length} />
          <LibraryStat label="待处理" value={`${pendingReviews}/${riskScans}`} helper="审核/风险" />
        </section>
        <CreatePromptForm />
      </TemplatePageWrap>

      <TemplateListSection vol={`${prompts.length} 个`} title="提示词资产" description="管理提示词版本与标签。">
        {prompts.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有提示词</p>
        ) : (
          <PromptLibraryList prompts={prompts} />
        )}
      </TemplateListSection>
    </>
  );
}

function LibraryStat({ label, value, helper }: { label: string; value: React.ReactNode; helper?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {helper && <div className="mt-1 text-xs text-white/38">{helper}</div>}
    </div>
  );
}
