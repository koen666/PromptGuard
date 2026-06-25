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
    <div className="mb-5 flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{tag}</div>
        <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
          {titleMuted && <span className="font-normal text-white/40"> {titleMuted}</span>}
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
    <section className="relative px-4 pb-7 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
          </div>
          {vol && <span className="text-xs text-white/25">{vol}</span>}
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/72 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">{children}</div>
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
  const inner = (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-white/8 p-3 transition last:border-b-0 hover:bg-white/[0.035] sm:p-4 lg:grid-cols-12">
      <div className="col-span-1 flex min-w-0 items-center gap-3 md:col-span-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60">
          {icon ? <Iconify icon={icon} width="18" /> : <span className="text-xs">{index + 1}</span>}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-white">{name}</h4>
          {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
        </div>
      </div>

      <div className="col-span-1 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-6">
        {specs.map((s) => (
          <div key={s.label} className={cn("min-w-0", s.wide && "sm:col-span-2")}>
            <div className="text-xs text-white/40">{s.label}</div>
            <span className="block min-w-0 truncate text-sm text-white/75" title={s.value}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="col-span-1 flex items-center justify-between gap-3 lg:col-span-2 lg:justify-end">
        {tier && <StatusPill value={tier} />}
        <div className="text-sm text-emerald-300">
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
    <section className="border-t border-white/5 bg-neutral-950 px-6 pb-20 pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/5 pt-12 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="mb-2 font-bricolage text-4xl font-light text-white md:text-5xl">{item.value}</div>
              <div className="text-xs uppercase tracking-widest text-white/40">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplatePageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes("fail") || normalized.includes("reject") || normalized.includes("risk") || normalized.includes("rolled")
    ? "border-red-400/25 bg-red-400/10 text-red-200"
    : normalized.includes("pending") || normalized.includes("draft") || normalized.includes("running")
      ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
      : normalized.includes("active") || normalized.includes("approved") || normalized.includes("completed") || normalized.includes("pass")
        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
        : "border-white/10 bg-white/5 text-white/60";

  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tone, className)}>
      {value}
    </span>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-white/10 bg-neutral-900/72 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-5", className)}>
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-white/45">{children}</label>;
}
