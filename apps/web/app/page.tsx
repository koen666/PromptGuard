import Link from "next/link";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Iconify } from "@/components/template/iconify";
import { StatusPill, getStatusLabel } from "@/components/template/sections";
import {
  getDashboardStats,
  getPrompt,
  listDatasets,
  listEvaluationRuns,
  listGrayReleases,
  listPrompts,
  listReviews,
  listSecurityScans,
  listUsers,
} from "@promptguard/core";

loadEnv();

const swatches = ["#ff66c4", "#ffe36e", "#70a5ff", "#8276ff", "#55e18e"];

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#1d1e24]/84 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}>
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
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {sub && <p className="mt-1 truncate text-xs text-white/36">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function avatarLabel(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return /[\u4e00-\u9fa5]/.test(trimmed[0]) ? trimmed[0] : trimmed.slice(0, 2).toUpperCase();
}

function formatEventTime(value?: string | null) {
  if (!value) return "暂无时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function buildDateColumns() {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const today = new Date();
  return Array.from({ length: 4 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - 1);
    return {
      day: String(date.getDate()),
      week: weekdays[date.getDay()],
      active: index === 1,
    };
  });
}

function TeamStack({ compact = false, members }: { compact?: boolean; members: string[] }) {
  const wrapClass = compact ? "flex -space-x-1.5" : "flex -space-x-2";
  const avatarClass = compact
    ? "flex h-6 w-6 items-center justify-center rounded-full border border-[#1d1e24] text-[8px] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.20)]"
    : "flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1d1e24] text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)]";
  const moreClass = compact
    ? "flex h-6 w-6 items-center justify-center rounded-full border border-[#1d1e24] bg-[#2a2c35] text-[8px] font-semibold text-white/60"
    : "flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1d1e24] bg-[#2a2c35] text-[10px] font-semibold text-white/60";

  const visibleMembers = members.slice(0, 4);
  const extraCount = Math.max(members.length - visibleMembers.length, 0);

  return (
    <div className={wrapClass}>
      {visibleMembers.map((name, index) => (
        <div
          key={name}
          className={avatarClass}
          style={{ background: swatches[index] }}
          title={name}
        >
          {avatarLabel(name)}
        </div>
      ))}
      {extraCount > 0 && <div className={moreClass}>+{extraCount}</div>}
    </div>
  );
}

function TaskCard({
  tone,
  title,
  sub,
  meta,
  href,
  actionLabel,
  members,
  className = "",
}: {
  tone: "yellow" | "blue" | "purple";
  title: string;
  sub: string;
  meta: string;
  href: string;
  actionLabel: string;
  members: string[];
  className?: string;
}) {
  const tones = {
    yellow: "bg-[#ffe36e] text-[#1a1820]",
    blue: "bg-[#7ab3ff] text-[#101826]",
    purple: "bg-[#8276ff] text-white",
  };
  const pill = tone === "yellow" ? "bg-white/55 text-[#1a1820]" : "bg-white/18 text-white";

  return (
    <Link href={href} className={`block rounded-[20px] p-4 shadow-[0_18px_36px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(0,0,0,0.28)] ${tones[tone]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] opacity-70">{sub}</div>
          <div className="mt-1 text-base font-semibold leading-tight">{title}</div>
        </div>
        <Iconify icon="solar:menu-dots-bold" width="18" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TeamStack compact members={members} />
        <span className="text-[11px] font-semibold opacity-80">{meta}</span>
      </div>
      <div className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${pill}`}>
        <Iconify icon="solar:document-text-linear" width="15" />
        {actionLabel}
      </div>
    </Link>
  );
}

function ReviewProgressCard({
  promptName,
  status,
  items,
}: {
  promptName: string;
  status: string;
  items: Array<{ label: string; done: boolean }>;
}) {
  const doneCount = items.filter((item) => item.done).length;
  const width = `${Math.round((doneCount / items.length) * 100)}%`;

  return (
    <Link href="/reviews" className="absolute left-4 right-4 top-[124px] rounded-[24px] bg-[#ff66c4] p-4 text-[#1d1420] shadow-[0_18px_38px_rgba(255,102,196,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(255,102,196,0.30)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs opacity-70">{promptName}</div>
          <div className="text-base font-bold">审核 {getStatusLabel(status)}</div>
        </div>
        <Iconify icon="solar:menu-dots-bold" width="18" />
      </div>
      <div className="mt-3 text-xs font-semibold">已完成 {doneCount}/{items.length}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/34">
        <div className="h-full rounded-full bg-[#1d1420]" style={{ width }} />
      </div>
      <div className="mt-3 space-y-1 text-xs font-medium">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={item.done ? "flex h-3.5 w-3.5 items-center justify-center rounded bg-[#1d1420] text-[9px] text-white" : "h-3.5 w-3.5 rounded border border-[#1d1420]/42"}>{item.done ? "✓" : ""}</span>
            {item.label}
          </div>
        ))}
      </div>
    </Link>
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
    <Link href={href} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-5 py-4 transition last:border-b-0 hover:bg-white/[0.045]">
      <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-white/[0.08] bg-[#262832] text-white/58">
        <Iconify icon={icon} width="18" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 truncate text-xs text-white/34">{meta}</div>
      </div>
      <div className="max-w-[160px] truncate text-right text-sm text-white/62">{value}</div>
    </Link>
  );
}

function AssetCard({
  prompt,
}: {
  prompt: Awaited<ReturnType<typeof listPrompts>>[number];
}) {
  return (
    <Link href={`/prompts/${prompt.id}`} className="group grid min-h-[112px] gap-3 rounded-[24px] border border-white/[0.07] bg-[#17181e]/78 p-4 transition hover:border-[#7067ff]/42 hover:bg-[#20222c]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{prompt.name}</div>
          <div className="mt-1 truncate text-xs text-white/34">{prompt.tags.join(", ") || "未打标签"}</div>
        </div>
        <StatusPill value={prompt.status} />
      </div>
      <div className="mt-auto flex items-center justify-between text-xs text-white/38">
        <span>v{prompt.versionCount}</span>
        <span>{formatDate(prompt.updatedAt)}</span>
      </div>
    </Link>
  );
}

function InsightBars() {
  const bars = [
    [28, 52, 34, 66, 46],
    [44, 76, 38, 58, 30],
    [32, 48, 70, 42, 62],
  ];
  const colors = ["#8276ff", "#ff66c4", "#55e18e"];

  return (
    <div className="mt-5 flex h-36 items-end justify-between gap-3 rounded-[24px] border border-white/[0.06] bg-[#17181e]/78 px-4 pb-4 pt-5">
      {Array.from({ length: 7 }).map((_, day) => (
        <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-full items-end gap-1">
            {bars.map((set, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full"
                style={{ height: `${set[day % set.length]}%`, backgroundColor: colors[index] }}
              />
            ))}
          </div>
          <span className="text-[10px] text-white/28">{"一二三四五六日"[day]}</span>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, prompts, datasets, runs, scans, reviews, releases, users] = await Promise.all([
    getDashboardStats(),
    listPrompts(),
    listDatasets(),
    listEvaluationRuns(),
    listSecurityScans(),
    listReviews(),
    listGrayReleases(),
    listUsers(),
  ]);

  const featured = prompts[0] ? await getPrompt(prompts[0].id) : null;
  const featuredVersion = featured?.versions[0];
  const activeRelease = releases.find((release) => release.status === "active");
  const pendingReviews = reviews.filter((review) => review.status === "pending");
  const failedScans = scans.filter((scan) => !scan.passed).length;
  const latestRun = runs[0];
  const latestScan = scans[0];
  const latestReview = reviews[0];
  const latestDataset = datasets[0];
  const teamMembers = users.map((user) => `${user.username}${user.roles.length ? ` · ${user.roles.join("/")}` : ""}`);
  const reviewActors = [
    ...reviews.map((review) => review.submittedBy),
    ...reviews.map((review) => review.reviewedBy),
  ].filter((actor): actor is string => Boolean(actor));
  const actorMembers = Array.from(new Set([
    ...teamMembers,
    ...reviewActors,
  ])).slice(0, 8);
  const cardMembers = actorMembers.length ? actorMembers : ["system"];
  const dateColumns = buildDateColumns();
  const promptName = featured?.name ?? prompts[0]?.name ?? "暂无 Prompt";
  const promptVersionLabel = featuredVersion ? `v${featuredVersion.versionNumber}` : "暂无版本";
  const checklistItems = [
    { label: "Prompt 版本", done: Boolean(featuredVersion) },
    { label: "评测完成", done: runs.some((run) => run.status === "completed") },
    { label: "安全扫描", done: scans.some((scan) => scan.status === "completed" && scan.passed) },
    { label: "人工审核", done: reviews.some((review) => review.status === "approved") },
    { label: "灰度发布", done: releases.some((release) => release.status === "active" || release.status === "completed") },
  ];
  const previewLines = (featuredVersion?.content ?? "PromptGuard 资产库等待导入核心提示词。")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <main className="relative z-10 px-0 py-3 sm:px-2 lg:px-5">
      <div className="mx-auto max-w-[1480px] space-y-4">
        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Panel className="min-h-[600px]">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7dff]">
                  <span className="h-2 w-2 rounded-full bg-[#8a7dff] shadow-[0_0_18px_rgba(138,125,255,0.8)]" />
                  PromptGuard 项目
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {promptName}
                </h1>
                <p className="mt-1 text-sm text-white/36">Web 控制台 / {promptVersionLabel} / 生命周期证据</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <TeamStack members={cardMembers} />
                <div className="rounded-[16px] bg-[#15161b] px-4 py-2 text-sm text-white/58">{prompts.length} 个 Prompt</div>
              </div>
            </div>

            <div className="grid min-h-[500px] grid-cols-1 gap-0 lg:grid-cols-[64px_repeat(4,minmax(0,1fr))]">
              <div className="hidden border-r border-white/[0.05] pt-16 text-xs text-white/30 lg:block">
                {["10:00", "11:00", "12:00", "13:00", "14:00"].map((time) => (
                  <div key={time} className="h-16 px-4">{time}</div>
                ))}
              </div>

              {dateColumns.map((item, index) => (
                <div key={item.day} className="relative min-h-[480px] border-r border-white/[0.05] last:border-r-0">
                  <div className="flex h-16 items-end justify-center gap-1 border-b border-white/[0.06] pb-4">
                    <span className={item.active ? "text-4xl font-semibold text-white" : "text-3xl font-semibold text-white/28"}>{item.day}</span>
                    <span className="mb-1 text-xs text-white/34">/{item.week}</span>
                  </div>
                  <div className="absolute inset-x-0 top-16 h-px bg-white/[0.05]" />
                  <div className="absolute inset-x-0 top-32 h-px bg-white/[0.05]" />
                  <div className="absolute inset-x-0 top-48 h-px bg-white/[0.05]" />
                  <div className="absolute inset-x-0 top-64 h-px bg-white/[0.05]" />

                  {index === 0 && (
                    <>
                      <TaskCard
                        className="absolute left-4 right-4 top-[88px]"
                        tone="yellow"
                        title={latestReview ? `审核 ${getStatusLabel(latestReview.status)}` : "暂无审核记录"}
                        sub={`${promptName} ${promptVersionLabel}`}
                        meta={latestReview ? `${latestReview.submittedBy ?? "engineer"} · ${formatEventTime(latestReview.createdAt)}` : "等待提交审核"}
                        href="/reviews"
                        actionLabel="查看审核证据"
                        members={cardMembers}
                      />
                      <TaskCard
                        className="absolute left-4 right-4 top-[252px]"
                        tone="blue"
                        title={activeRelease ? `${activeRelease.trafficPercent}% 灰度发布` : "暂无灰度发布"}
                        sub={activeRelease ? "发布控制" : "RoutePolicy"}
                        meta={activeRelease ? formatEventTime(activeRelease.createdAt) : "等待审核通过"}
                        href="/releases"
                        actionLabel="查看发布记录"
                        members={cardMembers}
                      />
                    </>
                  )}
                  {index === 1 && (
                    <div className="absolute left-4 right-4 top-[132px]">
                      <TaskCard
                        tone="purple"
                        title={latestRun ? `评测 ${getStatusLabel(latestRun.status)}` : "暂无评测任务"}
                        sub={latestDataset?.name ?? "未绑定数据集"}
                        meta={latestRun ? `均分 ${latestRun.avgScore?.toFixed(2) ?? "-"} · ${formatEventTime(latestRun.createdAt)}` : "等待运行评测"}
                        href="/evaluations"
                        actionLabel="查看评测结果"
                        members={cardMembers}
                      />
                    </div>
                  )}
                  {index === 2 && (
                    <Link href="/evaluations" className="absolute left-4 right-4 top-[88px] flex h-[180px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#55e18e]/42 bg-[#132421]/80 text-center transition hover:bg-[#183029]">
                      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#55e18e] text-[#132421] shadow-[0_14px_28px_rgba(85,225,142,0.32)]">
                        <Iconify icon="solar:add-circle-linear" width="22" />
                      </span>
                      <span className="text-sm font-semibold text-white">新增任务</span>
                      <span className="mt-1 text-xs text-white/36">运行评测</span>
                    </Link>
                  )}
                  {index === 3 && (
                    <ReviewProgressCard
                      promptName={promptName}
                      status={latestReview?.status ?? "pending"}
                      items={checklistItems}
                    />
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="当前运行状态"
              sub={activeRelease ? `${activeRelease.trafficPercent}% 灰度发布` : "路由策略空闲"}
              action={<StatusPill value={activeRelease ? "gray" : (featured?.status ?? "ready")} />}
            />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[20px] bg-[#15161b]/82 p-3">
                  <div className="text-xs text-white/32">提示词</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{stats.totalPrompts}</div>
                </div>
                <div className="rounded-[20px] bg-[#15161b]/82 p-3">
                  <div className="text-xs text-white/32">数据集</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{datasets.length}</div>
                </div>
                <div className="rounded-[20px] bg-[#15161b]/82 p-3">
                  <div className="text-xs text-white/32">风险</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{failedScans}</div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/[0.07] bg-[#15161b]/72 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-white/30">提示词预览</div>
                <div className="mt-3 grid gap-2 font-mono text-xs leading-5 text-white/58">
                  {previewLines.map((line, index) => (
                    <div key={`${line}-${index}`} className="flex gap-3">
                      <span className="text-white/24">{String(index + 1).padStart(2, "0")}</span>
                      <span className="line-clamp-1">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {swatches.map((color) => (
                  <span key={color} className="h-8 w-8 rounded-full" style={{ backgroundColor: color }} />
                ))}
                <Link href="/prompts" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.10] text-white/54">
                  <Iconify icon="solar:add-circle-linear" width="18" />
                </Link>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader title="最近资产" sub="提示词资产库" action={<Link href="/prompts" className="text-sm text-[#8a7dff] hover:text-white">查看全部</Link>} />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {prompts.slice(0, 4).map((prompt) => (
                <AssetCard key={prompt.id} prompt={prompt} />
              ))}
              {prompts.length === 0 && (
                <Link href="/prompts" className="flex min-h-[112px] items-center justify-center rounded-[24px] border border-dashed border-white/18 text-sm text-white/42">
                  导入第一个提示词
                </Link>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="团队洞察" sub="+19.24" action={<span className="text-xs text-white/36">天</span>} />
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] bg-[#15161b]/78 p-3">
                  <div className="text-xs text-white/34">耗时</div>
                  <div className="mt-2 text-2xl font-semibold text-white">9h</div>
                </div>
                <div className="rounded-[20px] bg-[#15161b]/78 p-3">
                  <div className="text-xs text-white/34">任务</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{runs.length + scans.length + reviews.length}</div>
                </div>
              </div>
              <InsightBars />
              <div className="mt-4 grid gap-2 text-xs text-white/44">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8276ff]" />进行中</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff66c4]" />推进中</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#55e18e]" />已完成</div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="运行队列" sub="最近评测、安全扫描和审核状态" action={<Link href="/audit" className="text-sm text-[#8a7dff] hover:text-white">审计</Link>} />
            <div>
              <WorkRow
                href="/evaluations"
                icon="solar:chart-2-linear"
                title="最近评测"
                meta={latestRun ? formatDate(latestRun.createdAt) : "等待中"}
                value={latestRun ? `${latestRun.avgScore?.toFixed(2) ?? "-"} / ${getStatusLabel(latestRun.status)}` : "暂无"}
              />
              <WorkRow
                href="/security"
                icon="solar:shield-check-linear"
                title="安全扫描"
                meta={latestScan ? formatDate(latestScan.createdAt) : "等待中"}
                value={latestScan ? `${latestScan.riskScore?.toFixed(1) ?? "-"} / ${latestScan.passed ? "通过" : "风险"}` : "暂无"}
              />
              <WorkRow
                href="/reviews"
                icon="solar:clipboard-check-linear"
                title="审核队列"
                meta={reviews[0] ? formatDate(reviews[0].createdAt) : "空闲"}
                value={`${pendingReviews.length} 条待审核`}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="SDK 接入" sub="业务代码加载灰度版本并阻断泄露" />
            <div className="p-5">
              <div className="rounded-[24px] border border-white/[0.07] bg-[#15161b]/78 p-4 font-mono text-xs leading-6 text-white/62">
                {[
                  "from promptguard import GuardedPrompt",
                  `prompt = GuardedPrompt.load(\"${featured?.name ?? "customer-service"}\")`,
                  "response = prompt.run(user_input)",
                  "return response.output",
                ].map((line, index) => (
                  <div key={`${line}-${index}`} className="flex gap-3">
                    <span className="select-none text-white/24">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 break-all">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
