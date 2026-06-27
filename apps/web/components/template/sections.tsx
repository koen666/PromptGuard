import Link from "next/link";
import { Iconify } from "./iconify";
import { cn } from "@/lib/utils";

export function TemplateSectionHeader({
  tag,
  title,
  titleMuted,
  action,
}: {
  tag: string;
  title: string;
  titleMuted?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col items-start justify-between gap-4 rounded-[28px] border border-white/[0.07] bg-[#1d1e24]/76 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:flex-row md:items-end">
      <div className="max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7dff]">
          <span className="h-2 w-2 rounded-full border border-[#8a7dff] shadow-[0_0_18px_rgba(138,125,255,0.7)]" />
          {tag}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
          {titleMuted && <span className="font-normal text-white/32"> {titleMuted}</span>}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function TemplateListSection({
  vol,
  title,
  description,
  children,
}: {
  vol?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative px-0 pb-5">
      <div className="relative z-10 mx-auto w-full max-w-[1480px]">
        <div className="mb-3 flex items-end justify-between gap-4 px-1">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-white/42">{description}</p>}
          </div>
          {vol && <span className="rounded-full bg-[#262832] px-2.5 py-1 text-xs text-white/38">{vol}</span>}
        </div>
        <div className="overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#1d1e24]/82 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">{children}</div>
      </div>
    </section>
  );
}

export function TemplateListItem({
  href,
  index,
  thumb,
  icon,
  name,
  sub,
  specs,
  tier,
}: {
  href?: string;
  index: number;
  thumb?: string;
  icon?: string;
  name: string;
  sub?: string;
  specs: Array<{ label: string; value: string; wide?: boolean }>;
  tier?: string;
}) {
  const displaySub = sub ? getStatusLabel(sub) : "";
  const inner = (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-white/[0.06] p-3 transition last:border-b-0 hover:bg-white/[0.045] sm:p-4 lg:grid-cols-12">
      <div className="col-span-1 flex min-w-0 items-center gap-3 md:col-span-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-white/[0.08] bg-[#262832] text-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {icon ? <Iconify icon={icon} width="18" /> : <span className="text-xs">{index + 1}</span>}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-white">{name}</h4>
          {sub && <p className="mt-1 text-xs text-white/36">{displaySub}</p>}
        </div>
      </div>

      <div className="col-span-1 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-6">
        {specs.map((s) => (
          <div key={s.label} className={cn("min-w-0", s.wide && "sm:col-span-2")}>
            <div className="text-xs text-white/32">{s.label}</div>
            <span className="block min-w-0 truncate text-sm text-white/70" title={s.value}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="col-span-1 flex items-center justify-between gap-3 lg:col-span-2 lg:justify-end">
        {tier && <StatusPill value={tier} />}
          <div className="text-sm text-[#8a7dff]">
          查看
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function TemplateStatsRow({
  items,
}: {
  items: Array<{ value: React.ReactNode; label: string }>;
}) {
  return (
    <section className="border-t border-white/[0.06] bg-[#17181d] px-6 pb-20 pt-20">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/5 pt-12 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mb-2 font-bricolage text-4xl font-light text-white md:text-5xl">{item.value}</div>
              <div className="text-xs uppercase tracking-widest text-white/38">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplatePageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full px-0 py-4 sm:px-2 lg:px-5">
      <div className="mx-auto max-w-[1480px]">{children}</div>
    </div>
  );
}

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes("fail") || normalized.includes("reject") || normalized.includes("risk") || normalized.includes("rolled")
    ? "border-[#ff6b92]/30 bg-[#ff6b92]/12 text-[#ff9fba]"
    : normalized.includes("pending") || normalized.includes("draft") || normalized.includes("running")
      ? "border-[#ffe36e]/28 bg-[#ffe36e]/12 text-[#ffe999]"
      : normalized.includes("active") || normalized.includes("approved") || normalized.includes("completed") || normalized.includes("pass")
        ? "border-[#55e18e]/28 bg-[#55e18e]/12 text-[#8df0b5]"
        : "border-white/[0.10] bg-white/[0.05] text-white/58";

  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", tone, className)}>
      {getStatusLabel(value)}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: "生效中",
  applied: "已应用",
  approved: "已通过",
  archived: "已归档",
  audit: "审计",
  clear: "已清空",
  completed: "已完成",
  diff: "版本差异",
  draft: "草稿",
  empty: "暂无",
  evaluated: "已评测",
  evaluation: "评测",
  fail: "失败",
  failed: "失败",
  "fallback draft": "兜底草案",
  gray: "灰度中",
  high: "高",
  idle: "空闲",
  improved: "有提升",
  low: "低",
  medium: "中",
  missing: "缺失",
  mock: "模拟",
  pass: "通过",
  passed: "通过",
  pending: "待审核",
  ready: "就绪",
  regressed: "有退化",
  rejected: "已驳回",
  release: "发布",
  risk: "风险",
  rolled_back: "已回滚",
  running: "运行中",
  security: "安全",
  security_checked: "安全已检",
  unknown: "未知",
  version: "版本",
  versioned: "已生成版本",
  "review model": "模型评审",
  review_pending: "待审核",
};

export function getStatusLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return STATUS_LABELS[normalized] ?? value;
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[26px] border border-white/[0.07] bg-[#1d1e24]/82 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-5", className)}>
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-white/38">{children}</label>;
}
