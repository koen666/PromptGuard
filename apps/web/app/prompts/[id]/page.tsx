import { getPrompt } from "@promptguard/core";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { Panel, StatusPill, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { PromptEditor } from "./editor";
import { PromptActions } from "./actions";

loadEnv();

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = await getPrompt(id);
  if (!prompt) notFound();

  const activeVersion = prompt.versions.find((v) => v.id === prompt.activeVersionId) ?? prompt.versions[0];

  return (
    <TemplatePageWrap>
      <TemplateSectionHeader
        tag="Prompt"
        title={prompt.name}
        titleMuted={`v${activeVersion?.versionNumber ?? 1}`}
        action={<StatusPill value={prompt.status} />}
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Panel>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">描述</div>
              <p className="mt-2 text-sm leading-6 text-white/62">{prompt.description || "暂无描述"}</p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">标签</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {prompt.tags.length ? prompt.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65">
                    {t}
                  </span>
                )) : <span className="text-sm text-white/40">无标签</span>}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">生命周期</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["当前版本", `v${activeVersion?.versionNumber ?? 1}`],
              ["版本总数", `${prompt.versions.length}`],
              ["最近更新", formatDate(prompt.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                <span className="text-white/45">{label}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <PromptEditor promptId={id} initialContent={activeVersion?.content ?? ""} />
          <PromptActions promptId={id} versionNumber={activeVersion?.versionNumber ?? 1} versions={prompt.versions} />
        </div>

        <Panel>
          <h2 className="text-lg font-semibold text-white">版本历史</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {prompt.versions.map((v) => (
              <li key={v.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={v.id === prompt.activeVersionId ? "font-semibold text-emerald-300" : "font-semibold text-white"}>
                      v{v.versionNumber}
                    </div>
                    <div className="mt-1 text-xs text-white/38">{formatDate(v.createdAt)}</div>
                  </div>
                  <Link
                    href={`/prompts/${id}/diff?from=${Math.max(1, v.versionNumber - 1)}&to=${v.versionNumber}`}
                    className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-white/5"
                  >
                    Diff
                  </Link>
                </div>
                {v.changelog && <p className="mt-2 text-xs leading-5 text-white/45">{v.changelog}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </TemplatePageWrap>
  );
}
