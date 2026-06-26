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

const coverStyles = [
  "from-[#d6c985] via-[#49614d] to-[#111315]",
  "from-[#7fb7be] via-[#324b55] to-[#121417]",
  "from-[#d89166] via-[#5c3940] to-[#121315]",
  "from-[#a8b56a] via-[#385346] to-[#101213]",
];

const quickActions = [
  { href: "/prompts", label: "导入资产", icon: "solar:archive-up-linear" },
  { href: "/evaluations", label: "运行评测", icon: "solar:play-circle-linear" },
  { href: "/security", label: "安全扫描", icon: "solar:shield-warning-linear" },
  { href: "/releases", label: "灰度发布", icon: "solar:rocket-2-linear" },
];

function MiniCover({ index, label }: { index: number; label: string }) {
  return (
    <div className={`h-14 w-24 shrink-0 rounded-lg bg-gradient-to-br ${coverStyles[index % coverStyles.length]} p-px shadow-[0_12px_28px_rgba(0,0,0,0.28)]`}>
      <div className="flex h-full w-full items-end rounded-lg border border-white/[0.12] bg-black/[0.12] p-2">
        <span className="line-clamp-2 text-[10px] font-semibold leading-3 text-white">{label}</span>
      </div>
    </div>
  );
}

function MetricCell({ label, value, tone = "text-white" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="border-l border-white/10 pl-4 first:border-l-0 first:pl-0">
      <div className="text-[11px] uppercase text-white/[0.38]">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function PromptCover({
  prompt,
  index,
}: {
  prompt: Awaited<ReturnType<typeof listPrompts>>[number];
  index: number;
}) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className={`group block min-h-[176px] rounded-lg bg-gradient-to-br ${coverStyles[index % coverStyles.length]} p-px shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5`}
    >
      <div className="flex h-full min-h-[176px] flex-col justify-between rounded-lg border border-white/[0.12] bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <Iconify icon="solar:shield-keyhole-linear" width="21" />
          <span className="rounded-md bg-black/[0.24] px-2 py-1 text-xs text-white/[0.72]">v{prompt.versionCount}</span>
        </div>
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{prompt.name}</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(prompt.tags.length ? prompt.tags : ["untagged"]).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-white/[0.12] px-2 py-1 text-[11px] text-white/[0.72]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
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
    .slice(0, 5);

  const operationRows = [
    {
      label: "最近评测",
      value: latestRun ? `${latestRun.avgScore?.toFixed(2) ?? "-"} / ${latestRun.status}` : "暂无",
      href: "/evaluations",
      icon: "solar:chart-2-linear",
      meta: latestRun ? formatDate(latestRun.createdAt) : "waiting",
    },
    {
      label: "安全扫描",
      value: latestScan ? `${latestScan.riskScore?.toFixed(1) ?? "-"} / ${latestScan.passed ? "通过" : "风险"}` : "暂无",
      href: "/security",
      icon: "solar:shield-check-linear",
      meta: latestScan ? formatDate(latestScan.createdAt) : "waiting",
    },
    {
      label: "审核队列",
      value: `${pendingReviews.length} pending`,
      href: "/reviews",
      icon: "solar:clipboard-check-linear",
      meta: reviews[0] ? formatDate(reviews[0].createdAt) : "idle",
    },
  ];

  return (
    <main className="relative z-10 px-2 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#121516] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <div className="grid min-h-[500px] lg:grid-cols-[1.24fr_0.76fr]">
            <div className={`relative min-h-[420px] bg-gradient-to-br ${coverStyles[0]}`}>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.16)_0,rgba(0,0,0,0)_34%,rgba(0,0,0,0.45)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#121516] to-transparent" />
              <div className="relative flex h-full min-h-[420px] flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  {prompts.slice(0, 3).map((prompt, index) => (
                    <MiniCover key={prompt.id} index={index} label={prompt.name} />
                  ))}
                </div>

                <div className="max-w-3xl">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-white/[0.66]">
                    <Iconify icon="solar:shield-keyhole-bold-duotone" width="18" />
                    Prompt Asset
                  </div>
                  <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                    {featured?.name ?? "PromptGuard Library"}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/[0.68]">
                    {featured?.description || "把核心 Prompt 作为可加载、可防护、可评测、可灰度的运行时资产管理。"}
                  </p>
                  <div className="mt-6 grid max-w-2xl gap-2 rounded-lg border border-white/[0.12] bg-black/[0.24] p-3 font-mono text-xs leading-5 text-white/[0.72]">
                    {previewLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="flex gap-3">
                        <span className="text-white/30">{String(index + 1).padStart(2, "0")}</span>
                        <span className="line-clamp-1">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex flex-col justify-between border-t border-white/10 bg-[#171a1b]/94 p-6 lg:border-l lg:border-t-0">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase text-white/[0.38]">active version</div>
                    <div className="mt-2 text-3xl font-semibold text-white">v{featuredVersion?.versionNumber ?? 0}</div>
                  </div>
                  <StatusPill value={activeRelease ? `${activeRelease.trafficPercent}% gray` : (featured?.status ?? "ready")} />
                </div>

                <div className="mt-7 grid grid-cols-3 gap-4">
                  <MetricCell label="Prompts" value={stats.totalPrompts} />
                  <MetricCell label="Datasets" value={datasets.length} />
                  <MetricCell label="Risks" value={failedScans} tone={failedScans ? "text-[#f2b36d]" : "text-white"} />
                </div>

                <div className="mt-7 space-y-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white/[0.78] transition hover:bg-white/[0.07] hover:text-white"
                    >
                      <span className="flex items-center gap-3">
                        <Iconify icon={action.icon} width="18" />
                        {action.label}
                      </span>
                      <Iconify icon="solar:alt-arrow-right-linear" width="17" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-white/10 bg-[#101213] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">运行时防护</div>
                    <div className="mt-1 text-xs text-white/[0.42]">input guard · prompt wrapping · output leak check</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d6c985] text-[#111315]">
                    <Iconify icon="solar:lock-keyhole-minimalistic-bold-duotone" width="22" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-white/[0.07] px-2 py-2 text-white/[0.64]">guard</div>
                  <div className="rounded-md bg-white/[0.07] px-2 py-2 text-white/[0.64]">route</div>
                  <div className="rounded-md bg-white/[0.07] px-2 py-2 text-white/[0.64]">audit</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">资产库</h2>
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/[0.58]" aria-label="上一组">
                  <Iconify icon="solar:alt-arrow-left-linear" width="18" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/[0.58]" aria-label="下一组">
                  <Iconify icon="solar:alt-arrow-right-linear" width="18" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {prompts.slice(0, 6).map((prompt, index) => (
                <PromptCover key={prompt.id} prompt={prompt} index={index + 1} />
              ))}
              {prompts.length === 0 && (
                <Link href="/prompts" className="flex min-h-[176px] items-center justify-center rounded-lg border border-dashed border-white/[0.16] bg-white/[0.03] text-sm text-white/[0.54]">
                  导入第一个 Prompt
                </Link>
              )}
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#171a1b]/84 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">运行队列</h2>
              <Link href="/audit" className="text-sm text-[#d6c985] hover:text-white">审计</Link>
            </div>
            <div className="divide-y divide-white/[0.08]">
              {operationRows.map((row) => (
                <Link key={row.label} href={row.href} className="flex items-center gap-3 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60">
                    <Iconify icon={row.icon} width="19" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-white">{row.label}</span>
                      <span className="text-xs text-white/[0.36]">{row.meta}</span>
                    </div>
                    <div className="mt-1 truncate text-sm text-white/[0.54]">{row.value}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-[#101213] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/[0.58]">待处理</span>
                <span className="text-2xl font-semibold text-white">{pendingReviews.length + failedScans + (activeRelease ? 1 : 0)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-[#d6c985]"
                  style={{ width: `${Math.min(100, 18 + pendingReviews.length * 18 + failedScans * 22)}%` }}
                />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
