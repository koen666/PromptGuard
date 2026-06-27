import { getProjectStatus } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";

loadEnv();

export default async function ProjectPage() {
  const status = await getProjectStatus(process.cwd());

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Project" title="Prompt 项目" titleMuted="Remote" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel>
            <div className="text-xs uppercase tracking-[0.14em] text-white/32">Project</div>
            <div className="mt-2 text-xl font-semibold text-white">{status.projectName}</div>
            <div className="mt-2 break-all text-sm text-white/42">{status.projectId}</div>
          </Panel>
          <Panel>
            <div className="text-xs uppercase tracking-[0.14em] text-white/32">Remote</div>
            {status.remote ? (
              <>
                <div className="mt-2 text-xl font-semibold text-white">{status.remote.name}</div>
                <div className="mt-2 break-all text-sm text-white/42">
                  mysql://{status.remote.user}@{status.remote.host}:{status.remote.port}/{status.remote.database}
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-white/45">尚未配置 remote，使用 pmg project remote set。</div>
            )}
          </Panel>
          <Panel>
            <div className="text-xs uppercase tracking-[0.14em] text-white/32">Sync</div>
            <div className="mt-2 flex items-center gap-2">
              <StatusPill value={status.remoteError ? "error" : status.remote ? "ready" : "pending"} />
              <span className="text-sm text-white/45">{status.remoteError || `${status.prompts.length} prompt asset(s)`}</span>
            </div>
          </Panel>
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="项目 Prompt" description="自动扫描 GuardedPrompt.load/create 引用，并显示本地与 remote 的同步状态。">
        {status.prompts.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">未检测到 Prompt 引用</p>
        ) : (
          status.prompts.map((prompt, index) => (
            <TemplateListItem
              key={`${prompt.name}-${prompt.source ?? "remote"}`}
              index={index}
              icon="solar:cloud-upload-linear"
              name={prompt.name}
              sub={prompt.remoteStatus}
              specs={[
                { label: "Local", value: prompt.localStatus },
                { label: "Version", value: prompt.versionNumber ? `v${prompt.versionNumber}` : "-" },
                { label: "Source", value: prompt.source ? `${prompt.source}:${prompt.line}` : "-" },
              ]}
              tier={prompt.remoteStatus}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}
