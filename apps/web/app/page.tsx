import Link from "next/link";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Iconify } from "@/components/template/iconify";
import { StatusPill } from "@/components/template/sections";
import {
  getDashboardStats,
  getPrompt,
  listDatasets,
  listEvaluationRuns,
  listGrayReleases,
  listPrompts,
  listReviews,
  listSecurityScans,
} from "@promptguard/core";

loadEnv();

const quickActions = [
  { href: "/prompts", label: "导入资产", icon: "solar:archive-up-linear" },
  { href: "/evaluations", label: "运行评测", icon: "solar:play-circle-linear" },
  { href: "/security", label: "安全扫描", icon: "solar:shield-warning-linear" },
  { href: "/releases", label: "灰度发布", icon: "solar:rocket-2-linear" },
];

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/[0.09] bg-[#151819]/90 shadow-[0_16px_46px_rgba(0,0,0,0.20)] ${className}`}>
      {children}
    </section>
  );
}

function PanelHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {sub && <p className="mt-1 truncate text-xs text-white/[0.42]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase text-white/[0.35]">{label}</div>
      <div className={`mt-1 truncate text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function WorkRow({
  href,
  icon,
  title,
  meta,
  value,
}: {
  href: string;
  icon: string;
  title: string;
  meta: string;
  value: string;
}) {
  return (
    <Link href={href} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-3 transition last:border-b-0 hover:bg-white/[0.035]">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.035] text-white/55">
        <Iconify icon={icon} width="18" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{title}</div>
        <div className="mt-1 truncate text-xs text-white/[0.38]">{meta}</div>
      </div>
      <div className="max-w-[160px] truncate text-right text-sm text-white/[0.62]">{value}</div>
    </Link>
  );
}

function AssetRow({
  prompt,
}: {
  prompt: Awaited<ReturnType<typeof listPrompts>>[number];
}) {
  return (
    <Link href={`/prompts/${prompt.id}`} className="grid gap-3 border-b border-white/[0.07] px-4 py-3 transition last:border-b-0 hover:bg-white/[0.035] md:grid-cols-[1fr_120px_160px_110px] md:items-center">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{prompt.name}</div>
        <div className="mt-1 truncate text-xs text-white/[0.38]">{prompt.tags.join(", ") || "untagged"}</div>
      </div>
      <div className="text-sm text-white/[0.62]">v{prompt.versionCount}</div>
      <div className="text-sm text-white/[0.42]">{formatDate(prompt.updatedAt)}</div>
      <StatusPill value={prompt.status} />
    </Link>
  );
}

export default async function DashboardPage() {
  const [stats, prompts, datasets, runs, scans, reviews, releases] = await Promise.all([
    getDashboardStats(),
    listPrompts(),
    listDatasets(),
    listEvaluationRuns(),
    listSecurityScans(),
    listReviews(),
    listGrayReleases(),
  ]);

  const featured = prompts[0] ? await getPrompt(prompts[0].id) : null;
  const featuredVersion = featured?.versions[0];
  const activeRelease = releases.find((release) => release.status === "active");
  const pendingReviews = reviews.filter((review) => review.status === "pending");
  const failedScans = scans.filter((scan) => !scan.passed).length;
  const latestRun = runs[0];
  const latestScan = scans[0];
  const previewLines = (featuredVersion?.content ?? "PromptGuard 资产库等待导入核心 Prompt。")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const lifecycleSteps = [
    { label: "版本", href: "/prompts", done: prompts.length > 0 },
    { label: "评测", href: "/evaluations", done: runs.some((run) => run.status === "completed") },
    { label: "安全", href: "/security", done: scans.some((scan) => scan.status === "completed" && scan.passed) },
    { label: "审核", href: "/reviews", done: reviews.some((review) => review.status === "approved") },
    { label: "灰度", href: "/releases", done: Boolean(activeRelease) },
    { label: "回滚", href: "/audit", done: releases.some((release) => release.status === "rolled_back") },
  ];

  const sdkSnippet = [
    "from promptguard import GuardedPrompt",
    `prompt = GuardedPrompt.load("${featured?.name ?? "customer-service"}", route_key=user_id)`,
    "response = prompt.run(user_input)",
    "return response.output",
  ];

  return (
    <main className="relative z-10 px-2 py-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-4">
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Panel className="p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#d6c985]">
                  <Iconify icon="solar:shield-keyhole-bold-duotone" width="17" />
                  PromptGuard Workspace
                </div>
                <h1 className="truncate text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {featured?.name ?? "Prompt 核心资产保护台"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/[0.58]">
                  围绕 Prompt 资产建立版本、评测、安全审查、审核、灰度发布和回滚证据链。
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-3 gap-4 rounded-lg border border-white/[0.08] bg-black/[0.14] p-4">
                <Metric label="Prompts" value={stats.totalPrompts} />
                <Metric label="Datasets" value={datasets.length} />
                <Metric label="Risks" value={failedScans} tone={failedScans ? "text-[#f2b36d]" : "text-white"} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white/[0.72] transition hover:bg-white/[0.07] hover:text-white">
                  <span className="flex min-w-0 items-center gap-3">
                    <Iconify icon={action.icon} width="18" />
                    <span className="truncate">{action.label}</span>
                  </span>
                  <Iconify icon="solar:alt-arrow-right-linear" width="16" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="当前运行状态"
              sub={activeRelease ? `${activeRelease.trafficPercent}% gray release` : "route policy idle"}
              action={<StatusPill value={activeRelease ? "gray" : (featured?.status ?? "ready")} />}
            />
            <div className="space-y-4 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs uppercase text-white/[0.34]">active version</div>
                  <div className="mt-1 text-3xl font-semibold text-white">v{featuredVersion?.versionNumber ?? 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-white/[0.34]">pending</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{pendingReviews.length + failedScans}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-white/[0.055] px-2 py-2 text-white/[0.58]">guard</div>
                <div className="rounded-md bg-white/[0.055] px-2 py-2 text-white/[0.58]">route</div>
                <div className="rounded-md bg-white/[0.055] px-2 py-2 text-white/[0.58]">audit</div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <PanelHeader title="核心闭环" sub="版本、评测、安全、审核、灰度和回滚" action={<Link href="/reports" className="text-sm text-[#d6c985] hover:text-white">报告</Link>} />
            <div className="grid gap-0 p-4 sm:grid-cols-6">
              {lifecycleSteps.map((step, index) => (
                <Link key={step.label} href={step.href} className="group relative border-b border-white/[0.07] px-3 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/[0.32]">0{index + 1}</span>
                    <span className={step.done ? "h-2 w-2 rounded-full bg-[#d6c985]" : "h-2 w-2 rounded-full bg-white/[0.18]"} />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white group-hover:text-[#d6c985]">{step.label}</div>
                  <div className="mt-1 text-xs text-white/[0.38]">{step.done ? "ready" : "todo"}</div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="运行队列" sub="最近评测、安全扫描和审核状态" action={<Link href="/audit" className="text-sm text-[#d6c985] hover:text-white">审计</Link>} />
            <div>
              <WorkRow
                href="/evaluations"
                icon="solar:chart-2-linear"
                title="最近评测"
                meta={latestRun ? formatDate(latestRun.createdAt) : "waiting"}
                value={latestRun ? `${latestRun.avgScore?.toFixed(2) ?? "-"} / ${latestRun.status}` : "暂无"}
              />
              <WorkRow
                href="/security"
                icon="solar:shield-check-linear"
                title="安全扫描"
                meta={latestScan ? formatDate(latestScan.createdAt) : "waiting"}
                value={latestScan ? `${latestScan.riskScore?.toFixed(1) ?? "-"} / ${latestScan.passed ? "通过" : "风险"}` : "暂无"}
              />
              <WorkRow
                href="/reviews"
                icon="solar:clipboard-check-linear"
                title="审核队列"
                meta={reviews[0] ? formatDate(reviews[0].createdAt) : "idle"}
                value={`${pendingReviews.length} pending`}
              />
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Panel>
            <PanelHeader title="Prompt 资产" sub="当前工作空间内的核心 Prompt" action={<Link href="/prompts" className="text-sm text-[#d6c985] hover:text-white">全部</Link>} />
            <div>
              {prompts.slice(0, 5).map((prompt) => (
                <AssetRow key={prompt.id} prompt={prompt} />
              ))}
              {prompts.length === 0 && (
                <Link href="/prompts" className="block px-4 py-10 text-center text-sm text-white/[0.48]">
                  导入第一个 Prompt
                </Link>
              )}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <PanelHeader title="SDK 接入" sub="业务代码加载灰度版本并阻断泄露" />
              <div className="p-4">
                <div className="rounded-lg border border-white/[0.08] bg-black/[0.22] p-3 font-mono text-xs leading-5 text-white/[0.68]">
                  {sdkSnippet.map((line, index) => (
                    <div key={`${line}-${index}`} className="flex gap-3">
                      <span className="select-none text-white/25">{String(index + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 break-all">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Prompt 预览" sub={featuredVersion ? `v${featuredVersion.versionNumber}` : "empty"} />
              <div className="grid gap-2 p-4 font-mono text-xs leading-5 text-white/[0.62]">
                {previewLines.map((line, index) => (
                  <div key={`${line}-${index}`} className="flex gap-3">
                    <span className="text-white/25">{String(index + 1).padStart(2, "0")}</span>
                    <span className="line-clamp-1">{line}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}
