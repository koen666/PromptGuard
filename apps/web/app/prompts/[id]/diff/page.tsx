import { getPrompt, getVersionDiff } from "@promptguard/core";
import { notFound } from "next/navigation";
import { loadEnv } from "@/lib/env";
import { TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { DiffVersionPicker } from "@/components/diff-version-picker";

loadEnv();

function renderDiff(patch: string) {
  return patch.split("\n").map((line, i) => {
    let cls = "text-white/60";
    if (line.startsWith("+") && !line.startsWith("+++")) cls = "diff-add";
    else if (line.startsWith("-") && !line.startsWith("---")) cls = "diff-remove";
    return (
      <div key={i} className={cls}>
        {line}
      </div>
    );
  });
}

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const prompt = await getPrompt(id);
  if (!prompt) notFound();

  const sortedVersions = [...prompt.versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const latestVersion = sortedVersions.at(-1)?.versionNumber ?? 1;
  const from = parseInt(sp.from ?? String(Math.max(1, latestVersion - 1)));
  const to = parseInt(sp.to ?? String(latestVersion));
  const diff = await getVersionDiff(id, from, to);
  const summary = summarizePatch(diff.patch);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="差异" title={`v${from} → v${to}`} titleMuted={prompt.name + "。"} />
        <DiffVersionPicker promptId={id} versions={sortedVersions} from={from} to={to} />
        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <DiffStat label="基准版本" value={`v${from}`} />
          <DiffStat label="目标版本" value={`v${to}`} />
          <DiffStat label="新增行数" value={`+${summary.added}`} tone="text-emerald-300" />
          <DiffStat label="删除行数" value={`-${summary.removed}`} tone="text-red-300" />
        </section>
        <pre className="animate-on-scroll overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 font-mono text-xs whitespace-pre-wrap">
          {renderDiff(diff.patch)}
        </pre>
      </TemplatePageWrap>
    </>
  );
}

function summarizePatch(patch: string) {
  return patch.split("\n").reduce(
    (acc, line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) acc.added += 1;
      if (line.startsWith("-") && !line.startsWith("---")) acc.removed += 1;
      return acc;
    },
    { added: 0, removed: 0 },
  );
}

function DiffStat({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
