import Link from "next/link";
import { getProjectStatus, listPrompts } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { Iconify } from "@/components/template/iconify";
import { PromptRowActions } from "./prompt-row-actions";

loadEnv();

const PROJECT_COPY: Record<string, { name: string; description: string; tone: string; icon: string }> = {
  "support-chat-system": {
    name: "售后对话系统",
    description: "面向订单、物流、退款和售后工单的客服 Prompt 项目。",
    tone: "from-[#6da8ff]/22 via-[#6f64ff]/12 to-transparent",
    icon: "solar:chat-round-dots-linear",
  },
  "order-risk-system": {
    name: "订单风控系统",
    description: "用于识别欺诈、套利、刷单和异常履约风险的审核项目。",
    tone: "from-[#ff7a59]/20 via-[#ffe36e]/10 to-transparent",
    icon: "solar:shield-warning-linear",
  },
  "knowledge-base-assistant": {
    name: "知识库问答助手",
    description: "帮助客服和运营基于知识片段回答政策、流程和话术问题。",
    tone: "from-[#54e1a6]/18 via-[#4fd1ff]/10 to-transparent",
    icon: "solar:book-bookmark-linear",
  },
};

function projectFromSource(source?: string) {
  const parts = source?.split("/") ?? [];
  if (parts[0] === "pre" && parts[1]) return parts[1];
  return "workspace";
}

function projectTitle(slug: string) {
  if (PROJECT_COPY[slug]) return PROJECT_COPY[slug].name;
  if (slug === "workspace") return "当前工作区";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ProjectPage() {
  const status = await getProjectStatus(process.cwd());
  const prompts = await listPrompts();
  const promptsById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const promptsByName = new Map(prompts.map((prompt) => [prompt.name, prompt]));
  const grouped = new Map<string, typeof status.prompts>();

  for (const prompt of status.prompts) {
    const projectSlug = projectFromSource(prompt.source);
    grouped.set(projectSlug, [...(grouped.get(projectSlug) ?? []), prompt]);
  }

  const projects = Array.from(grouped.entries()).map(([slug, items]) => {
    const copy = PROJECT_COPY[slug];
    const trackedCount = items.filter((item) => item.localStatus === "tracked").length;
    const latestVersion = Math.max(...items.map((item) => item.versionNumber ?? 0), 0);
    return {
      slug,
      name: projectTitle(slug),
      description: copy?.description ?? "从当前工作区源码中扫描到的 Prompt 项目。",
      icon: copy?.icon ?? "solar:folder-with-files-linear",
      tone: copy?.tone ?? "from-[#8a7dff]/18 via-[#4fd1ff]/8 to-transparent",
      prompts: items,
      trackedCount,
      latestVersion,
    };
  });

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="Projects"
          title="项目管理"
          titleMuted="Prompt 资产"
          action={
            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#14151a]/72 px-3 py-2 text-xs text-white/46">
              <Iconify icon="solar:folder-check-linear" width="16" />
              <span>{projects.length} 个项目</span>
              <span className="text-white/20">/</span>
              <span>{status.prompts.length} 个 Prompt</span>
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.slug} href={`#${project.slug}`} className="group block">
              <Panel className="relative overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-[#202129]/88">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${project.tone}`} />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.055] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Iconify icon={project.icon} width="20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-white">{project.name}</h3>
                      <StatusPill value={project.trackedCount === project.prompts.length ? "active" : "pending"} />
                    </div>
                    <p className="mt-1 truncate text-xs text-white/42">{project.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
                      <span>{project.prompts.length} Prompt</span>
                      <span className="text-white/18">/</span>
                      <span>{project.trackedCount} 已入库</span>
                      <span className="text-white/18">/</span>
                      <span>v{project.latestVersion || 1}</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </TemplatePageWrap>

      {projects.length === 0 ? (
        <TemplateListSection title="项目资产" description="自动扫描业务项目里的 GuardedPrompt.load/create 引用。">
          <p className="px-4 py-6 text-center text-white/40">未检测到 Prompt 引用</p>
        </TemplateListSection>
      ) : (
        projects.map((project) => (
          <TemplateListSection
            key={project.slug}
            title={project.name}
            description={project.description}
            vol={`${project.prompts.length} prompts`}
          >
            <div id={project.slug} className="scroll-mt-24" />
            {project.prompts.map((prompt, index) => {
              const promptRecord = prompt.promptId ? promptsById.get(prompt.promptId) : promptsByName.get(prompt.name);
              return (
                <TemplateListItem
                  key={`${project.slug}-${prompt.name}-${prompt.source ?? "database"}`}
                  index={index}
                  icon={project.icon}
                  name={prompt.name}
                  sub={prompt.localStatus}
                  specs={[
                    { label: "状态", value: promptRecord?.status ?? prompt.localStatus },
                    { label: "版本", value: prompt.versionNumber ? `v${prompt.versionNumber}` : "-" },
                    { label: "来源", value: prompt.source ? `${prompt.source}:${prompt.line}` : "数据库记录", wide: true },
                  ]}
                  tier={prompt.localStatus}
                  action={
                    <PromptRowActions
                      promptId={promptRecord?.id}
                      versionNumber={prompt.versionNumber}
                    />
                  }
                />
              );
            })}
          </TemplateListSection>
        ))
      )}
    </>
  );
}
