import Link from "next/link";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Iconify } from "@/components/template/iconify";
import { Panel, StatusPill } from "@/components/template/sections";
import {
  getDashboardStats,
  listDatasets,
  listEvaluationRuns,
  listGrayReleases,
  listPrompts,
  listReviews,
  listSecurityScans,
} from "@promptguard/core";

loadEnv();

const workflow = [
  { title: "资产版本", desc: "创建 Prompt、保存快照、查看 Diff", href: "/prompts", icon: "solar:document-text-linear" },
  { title: "数据评测", desc: "选择数据集，运行模型评分", href: "/evaluations", icon: "solar:chart-2-linear" },
  { title: "安全保护", desc: "诱导泄露测试与风险记录", href: "/security", icon: "solar:shield-check-linear" },
  { title: "人工审核", desc: "汇总依据，通过或驳回", href: "/reviews", icon: "solar:clipboard-check-linear" },
  { title: "灰度回滚", desc: "小比例试用，异常快速切回", href: "/releases", icon: "solar:rocket-2-linear" },
];

function Stat({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/72 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
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

  const latestRun = runs[0];
  const latestScan = scans[0];
  const activeRelease = releases.find((r) => r.status === "active");
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const failedScans = scans.filter((s) => !s.passed).length;
  const openTasks = pendingReviews.length + failedScans + (activeRelease ? 1 : 0);

  return (
    <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Panel className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">PromptGuard</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Prompt 生命周期工作台
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
                  把创建、版本快照、数据集评测、安全扫描、人工审核、灰度发布和回滚放在同一条可追踪流程里。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/prompts" className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-300">
                  新建 Prompt
                </Link>
                <Link href="/evaluations" className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                  发起评测
                </Link>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">今日待处理</div>
                <div className="mt-2 text-3xl font-semibold text-white">{openTasks}</div>
              </div>
              <StatusPill value={openTasks ? "需要处理" : "稳定"} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/58">
              <div className="flex justify-between"><span>待审核</span><span className="text-white">{pendingReviews.length}</span></div>
              <div className="flex justify-between"><span>安全风险</span><span className="text-white">{failedScans}</span></div>
              <div className="flex justify-between"><span>活跃灰度</span><span className="text-white">{activeRelease ? 1 : 0}</span></div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Stat label="Prompt" value={stats.totalPrompts} />
          <Stat label="数据集" value={datasets.length} />
          <Stat label="评测任务" value={runs.length} />
          <Stat label="安全扫描" value={scans.length} tone={failedScans ? "text-amber-200" : "text-white"} />
          <Stat label="待审核" value={stats.pendingReviews} tone={stats.pendingReviews ? "text-amber-200" : "text-white"} />
          <Stat label="灰度中" value={stats.activeGrayReleases} tone={stats.activeGrayReleases ? "text-emerald-200" : "text-white"} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">主链路</h2>
                <p className="mt-1 text-sm text-white/48">从资产修改到小范围试用的闭环。</p>
              </div>
              <Link href="/audit" className="text-sm text-emerald-300 hover:text-emerald-200">审计记录</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {workflow.map((item, index) => (
                <Link key={item.href} href={item.href} className="group rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-emerald-200">
                      <Iconify icon={item.icon} width="18" />
                    </div>
                    <span className="font-mono text-xs text-white/28">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-white/45">{item.desc}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">运行状态</h2>
            <div className="mt-4 divide-y divide-white/10 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-white/50">最近评测</span>
                <span className="font-medium text-white">{latestRun ? `${latestRun.avgScore?.toFixed(2) ?? "-"} / ${latestRun.status}` : "暂无"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-white/50">最近安全扫描</span>
                <span className="font-medium text-white">{latestScan ? `${latestScan.riskScore?.toFixed(1) ?? "-"} / ${latestScan.passed ? "通过" : "风险"}` : "暂无"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-white/50">当前发布</span>
                <span className="font-medium text-white">{activeRelease ? `${activeRelease.trafficPercent}% 灰度` : "暂无活跃灰度"}</span>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel>
            <h2 className="text-lg font-semibold text-white">最近 Prompt</h2>
            <div className="mt-4 space-y-2">
              {prompts.slice(0, 5).map((prompt) => (
                <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 hover:bg-white/[0.04]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{prompt.name}</div>
                    <div className="mt-1 text-xs text-white/42">v{prompt.versionCount} · {prompt.tags.join(", ") || "无标签"}</div>
                  </div>
                  <StatusPill value={prompt.status} />
                </Link>
              ))}
              {prompts.length === 0 && <p className="text-sm text-white/45">暂无 Prompt。</p>}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">审核队列</h2>
            <div className="mt-4 space-y-2">
              {reviews.slice(0, 5).map((review) => (
                <Link key={review.id} href="/reviews" className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 hover:bg-white/[0.04]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{review.promptId}</div>
                    <div className="mt-1 text-xs text-white/42">{formatDate(review.createdAt)} · {review.submittedBy}</div>
                  </div>
                  <StatusPill value={review.status} />
                </Link>
              ))}
              {reviews.length === 0 && <p className="text-sm text-white/45">暂无审核记录。</p>}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-white">发布观察</h2>
            {activeRelease ? (
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs text-white/40">灰度</div>
                  <div className="mt-2 font-semibold text-white">{activeRelease.trafficPercent}%</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs text-white/40">观察分</div>
                  <div className="mt-2 font-semibold text-white">{activeRelease.observationScore?.toFixed(2) ?? "-"}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs text-white/40">延迟</div>
                  <div className="mt-2 font-semibold text-white">{activeRelease.observationLatencyMs ?? "-"}ms</div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/45">暂无活跃灰度发布。</p>
            )}
          </Panel>
        </section>
      </div>
    </main>
  );
}
