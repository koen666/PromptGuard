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

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Diff" title={`v${from} → v${to}`} titleMuted={prompt.name + "."} />
        <DiffVersionPicker promptId={id} versions={sortedVersions} from={from} to={to} />
        <pre className="animate-on-scroll overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 font-mono text-xs whitespace-pre-wrap">
          {renderDiff(diff.patch)}
        </pre>
      </TemplatePageWrap>
    </>
  );
}
