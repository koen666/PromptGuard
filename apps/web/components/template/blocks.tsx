import Link from "next/link";
import { TEMPLATE } from "./constants";
import { Iconify } from "./iconify";
import { TemplateMissionFilter } from "./mission-filter";

function BarSpectrum({ seed }: { seed: number }) {
  const heights = [40, 60, 80, 65, 50, 45, 60, 75, 90, 70, 55, 40];
  return (
    <div className="col-span-3 mt-2">
      <div className="mb-1 flex items-center justify-between text-xs text-white/30">
        <span>Signal</span>
        <span>Response</span>
      </div>
      <div className="flex h-8 items-end gap-0.5 opacity-50">
        {heights.map((h, i) => (
          <div
            key={i}
            className="bar-anim w-1 rounded-t-sm bg-white"
            style={{
              height: `${h}%`,
              animationDuration: `${1.5 + ((seed + i) % 5) * 0.3}s`,
              animationDelay: `${-((seed + i) % 8) * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function TemplateMaterialItem({
  href,
  index,
  thumb,
  icon,
  name,
  sub,
  specs,
  tier,
  chartLabel = "Metric",
}: {
  href?: string;
  index: number;
  thumb: string;
  icon: string;
  name: string;
  sub: string;
  specs: Array<{ label: string; value: string; icon?: string }>;
  tier: string;
  chartLabel?: string;
}) {
  const delay = 0.25 + index * 0.15;
  const inner = (
    <div
      className="group grid animate-on-scroll grid-cols-1 items-center gap-6 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 md:grid-cols-12 md:p-6"
      style={{ animation: `fanSlideIn 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s both` }}
    >
      <div className="col-span-1 flex items-center gap-6 md:col-span-4">
        <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white md:h-24 md:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} className="h-full w-full object-cover" alt="" />
        </div>
        <div>
          <Iconify icon={icon} width="32" className="mb-1 text-white/60" />
          <h4 className="font-bricolage text-xl font-light text-white">{name}</h4>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{sub}</p>
        </div>
      </div>

      <div className="col-span-1 grid grid-cols-2 gap-x-2 gap-y-4 border-l border-white/10 pl-6 sm:grid-cols-3 md:col-span-6">
        {specs.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/50">
              {s.icon && <Iconify icon={s.icon} width="14" />}
              {s.label}
            </div>
            <span className="text-sm text-white">{s.value}</span>
          </div>
        ))}
        <BarSpectrum seed={index} />
      </div>

      <div className="col-span-1 flex items-center justify-between gap-6 md:col-span-2 md:justify-end">
        <span className="font-serif text-xl italic text-white">{tier}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-colors group-hover:border-white hover:bg-white hover:text-black">
          <Iconify icon="solar:file-download-linear" width="18" />
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function TemplateInfrastructure() {
  return (
    <section id="infrastructure" className="relative overflow-hidden bg-neutral-900 py-24 text-white">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-500">Pipeline</span>
            </div>
            <h2 className="animate-on-scroll font-bricolage text-4xl font-medium leading-tight md:text-6xl">
              Evaluation
              <br />
              <span className="text-white/40">Infrastructure</span>
            </h2>
            <p className="animate-on-scroll mb-8 mt-6 text-lg font-light leading-relaxed text-white/60 delay-100">
              从 Prompt 版本到数据集、评测引擎、审核与灰度发布，构成完整的 LLM 应用迭代链路。
            </p>
            <div className="space-y-6">
              {[
                { icon: "solar:box-minimalistic-linear", title: "版本管理", desc: "Prompt 多版本存储与 diff 对比。" },
                { icon: "solar:bolt-circle-linear", title: "自动评测", desc: "Mock / OpenAI / Anthropic 统一评测接口。" },
              ].map((item, i) => (
                <div key={item.title} className={`group flex animate-on-scroll gap-4 delay-${(i + 2) * 100}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:bg-white/10">
                    <Iconify icon={item.icon} width="24" className="text-white" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-bricolage text-xl font-medium">{item.title}</h4>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/evaluations"
              className="group animate-on-scroll mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-neutral-200 delay-300"
            >
              查看评测
              <Iconify icon="solar:arrow-right-linear" className="transition-transform group-hover:translate-x-1" width="18" />
            </Link>
          </div>

          <div className="group animate-on-scroll relative h-[300px] w-full overflow-hidden rounded-2xl border border-white/10 md:h-[500px] lg:h-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TEMPLATE.cardImage2}
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-neutral-900/20" />
            <div className="group/spot absolute left-1/3 top-1/4">
              <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-emerald-500" />
              <div className="relative z-10 h-4 w-4 cursor-pointer rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              <div className="pointer-events-none absolute left-6 top-0 w-56 translate-y-2 rounded-xl border border-white/10 bg-black/80 px-4 py-3 opacity-0 backdrop-blur-md transition-all duration-300 group-hover/spot:translate-y-0 group-hover/spot:opacity-100">
                <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-emerald-400">Prompt Hub</span>
                <span className="block text-[11px] text-white/70">版本与标签管理</span>
              </div>
            </div>
            <div className="group/spot absolute bottom-1/3 right-1/4">
              <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-blue-500 [animation-delay:0.5s]" />
              <div className="relative z-10 h-4 w-4 cursor-pointer rounded-full border-2 border-white bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              <div className="pointer-events-none absolute right-6 top-0 w-56 translate-y-2 rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-right opacity-0 backdrop-blur-md transition-all duration-300 group-hover/spot:translate-y-0 group-hover/spot:opacity-100">
                <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-blue-400">Gray Release</span>
                <span className="block text-[11px] text-white/70">流量控制与回滚</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TemplateTimeline({
  items,
}: {
  items: Array<{ year: string; title: string; description: string; node: string }>;
}) {
  return (
    <section id="timeline" className="relative overflow-hidden border-t border-white/5 bg-neutral-950 py-32">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="animate-on-scroll mb-24 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-500">Chronology</span>
          <h2 className="mt-4 font-bricolage text-5xl font-semibold tracking-tight text-white md:text-7xl">The Ascent</h2>
        </div>
        <div className="relative">
          {items.map((item, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={item.year} className="group mb-24 flex flex-col items-center justify-between md:flex-row">
                <div
                  className={`animate-on-scroll order-2 w-full md:w-5/12 ${flip ? "md:order-1 md:text-right" : "md:order-1 md:pr-12 md:text-right"} text-center`}
                  data-anim="slide-right"
                >
                  {!flip && (
                    <>
                      <h3 className="font-bricolage text-3xl text-white">{item.title}</h3>
                      <p className="mt-2 font-light text-white/40">{item.description}</p>
                    </>
                  )}
                  {flip && (
                    <span className="pointer-events-none absolute -translate-y-12 select-none font-bricolage text-8xl font-bold text-white/5 md:right-12">
                      {item.year}
                    </span>
                  )}
                </div>
                <div className="relative z-10 order-1 mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-neutral-900 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] md:order-2 md:mb-0">
                  <span className="font-mono text-xs">{item.node}</span>
                </div>
                <div
                  className={`animate-on-scroll order-3 w-full md:w-5/12 ${flip ? "md:pl-12 md:text-left" : ""} text-center`}
                  data-anim="slide-left"
                >
                  {flip ? (
                    <>
                      <h3 className="font-bricolage text-3xl text-white">{item.title}</h3>
                      <p className="mt-2 font-light text-white/40">{item.description}</p>
                    </>
                  ) : (
                    <span className="pointer-events-none absolute -translate-y-12 select-none font-bricolage text-8xl font-bold text-white/5">
                      {item.year}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TemplateCoreSystems() {
  const cards = [
    {
      glow: "from-emerald-500/5",
      iconColor: "text-emerald-400",
      dot: "bg-emerald-500",
      statusColor: "text-emerald-400",
      icon: "solar:cpu-bolt-linear",
      status: "Online",
      title: "Eval Engine",
      desc: "多模型自动评测，统一 relevance / format 评分接口。",
      href: "/evaluations",
    },
    {
      glow: "from-blue-500/5",
      iconColor: "text-blue-400",
      dot: "bg-blue-500",
      statusColor: "text-blue-400",
      icon: "solar:shield-star-linear",
      status: "Integrity 100%",
      title: "Security Scan",
      desc: "诱导测试与 Prompt 泄露风险检测。",
      href: "/security",
    },
    {
      glow: "from-purple-500/5",
      iconColor: "text-purple-400",
      dot: "bg-purple-500",
      statusColor: "text-purple-400",
      icon: "solar:atom-linear",
      status: "Stable",
      title: "Gray Release",
      desc: "流量比例控制、观察指标与一键回滚。",
      href: "/releases",
    },
  ];

  return (
    <section id="systems" className="relative overflow-hidden border-t border-white/5 bg-black py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="animate-on-scroll mb-16 flex flex-col items-end justify-between md:flex-row">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-12 bg-white/20" />
              <span className="font-mono text-xs uppercase tracking-widest text-white/50">System Architecture</span>
            </div>
            <h2 className="mb-6 font-bricolage text-5xl leading-none tracking-tighter text-white md:text-7xl">Core Systems</h2>
            <p className="max-w-lg text-lg font-light leading-relaxed text-white/50">
              PromptGuard 核心模块：评测、安全、发布三位一体。
            </p>
          </div>
          <Link
            href="/settings"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition-all hover:bg-neutral-200 md:mt-0"
          >
            <span>系统设置</span>
            <Iconify icon="solar:arrow-right-linear" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {cards.map((card, i) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative h-[500px] animate-on-scroll overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/40 p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-neutral-900/60 delay-${(i + 1) * 100}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${card.glow} to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100`} />
              <div className={`relative z-10 mb-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${card.iconColor} transition-all duration-500 group-hover:scale-110`}>
                <Iconify icon={card.icon} className="text-2xl" />
              </div>
              <div className="relative z-10 mt-auto pt-32">
                <div className="mb-3 flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${card.dot}`} />
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${card.statusColor}`}>{card.status}</span>
                </div>
                <h3 className="mb-3 font-bricolage text-3xl tracking-tight text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-white/40 transition-colors group-hover:text-white/60">{card.desc}</p>
                <div className="relative mt-6 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="absolute inset-0 w-full -translate-x-full bg-emerald-500 transition-transform duration-1000 ease-out group-hover:translate-x-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplateTrustedStats({
  logos,
  stats,
}: {
  logos: string[];
  stats: Array<{ value: React.ReactNode; label: string }>;
}) {
  return (
    <section className="border-t border-white/5 bg-neutral-950 px-6 pb-20 pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-white/30">Platform Modules</span>
        </div>
        <div className="animate-on-scroll grid grid-cols-2 gap-8 opacity-40 grayscale transition-all duration-500 hover:grayscale-0 md:grid-cols-4 lg:grid-cols-6">
          {logos.map((logo) => (
            <div key={logo} className="flex h-12 items-center justify-center font-bricolage text-xl font-bold tracking-tighter text-white">
              {logo}
            </div>
          ))}
        </div>
        <div className="mt-20 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/5 pt-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mb-2 font-bricolage text-4xl font-light text-white md:text-5xl">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplateCareers({
  jobs,
}: {
  jobs: Array<{ href: string; icon: string; title: string; location: string; dept: string; type: string }>;
}) {
  return (
    <section id="careers" className="relative border-t border-white/5 bg-neutral-950 px-6 pb-24 pt-24">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] mix-blend-screen" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="animate-on-scroll max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-500">Quick Actions</span>
            </div>
            <h2 className="font-bricolage text-5xl font-medium leading-[0.9] tracking-tighter text-white md:text-7xl">
              Join the
              <span className="text-white/30"> Workflow.</span>
            </h2>
          </div>
          <p className="mb-2 max-w-md text-lg font-light leading-relaxed text-neutral-400">
            快捷进入审核、发布与设置，完成 Prompt 迭代闭环。
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {jobs.map((job, i) => (
            <Link
              key={job.title}
              href={job.href}
              className={`group relative block animate-on-scroll rounded-3xl bg-gradient-to-br from-white/10 to-white/0 p-px transition-all duration-500 hover:from-white/20 hover:to-white/5 delay-${(i + 1) * 100}`}
            >
              <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[23px] border border-white/5 bg-neutral-900/80 p-6 backdrop-blur-xl transition-colors group-hover:border-transparent md:flex-row md:p-8">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 opacity-0 blur-[80px] transition-opacity duration-700 group-hover:opacity-100" />
                <div className="z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all duration-500 group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white/10">
                  <Iconify icon={job.icon} width="28" />
                </div>
                <div className="z-10 flex-1 text-center md:text-left">
                  <h3 className="mb-2 font-bricolage text-xl font-medium text-white">{job.title}</h3>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-400 md:justify-start">
                    <span className="flex items-center gap-1.5">
                      <Iconify icon="solar:map-point-linear" width="16" />
                      {job.location}
                    </span>
                    <span className="my-auto h-1 w-1 rounded-full bg-neutral-600" />
                    <span className="flex items-center gap-1.5">
                      <Iconify icon="solar:atom-linear" width="16" />
                      {job.dept}
                    </span>
                  </div>
                </div>
                <div className="z-10 flex items-center gap-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white/60 transition-colors group-hover:border-white/30 group-hover:bg-white/10 group-hover:text-white">
                    {job.type}
                  </span>
                  <div className="flex h-10 w-10 -translate-x-4 items-center justify-center rounded-full border border-white/20 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:border-white/50 group-hover:opacity-100">
                    <Iconify icon="solar:arrow-right-linear" width="20" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TemplateProjectsGrid({
  prompts,
}: {
  prompts: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    versionCount: number;
    updatedAt: string;
  }>;
}) {
  return (
    <section id="projects" className="relative overflow-hidden bg-neutral-950 py-24 text-white selection:bg-emerald-500/30 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[80vw] -translate-x-1/2 animate-pulse rounded-full bg-emerald-900/20 opacity-40 mix-blend-screen blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-[60vw] rounded-full bg-blue-900/10 opacity-30 mix-blend-screen blur-[120px]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="animate-on-scroll relative max-w-3xl">
            <div className="absolute -left-4 top-1 bottom-1 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-50 md:-left-8" />
            <div className="mb-4 flex items-center gap-3 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin-slow-reverse">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400/80">Mission Log</span>
            </div>
            <h2 className="font-bricolage text-5xl font-medium leading-[0.9] tracking-tighter text-white md:text-8xl">
              Stellar
              <span className="font-light text-white/20"> Range.</span>
            </h2>
          </div>
          <TemplateMissionFilter />
        </div>

        <div className="grid h-auto grid-cols-1 gap-6 md:h-[800px] md:grid-cols-12">
          {prompts[0] && (
            <Link
              href={`/prompts/${prompts[0].id}`}
              className="group relative animate-on-scroll overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-900 shadow-2xl delay-200 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-white/20 md:col-span-8 md:row-span-2"
            >
              <div className="absolute inset-0 z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TEMPLATE.cardImage1} className="h-full w-full object-cover opacity-60 grayscale transition-all duration-1000 ease-out group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              </div>
              <div className="absolute left-8 right-8 top-8 z-20 flex justify-between">
                <div className="flex gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 backdrop-blur">{prompts[0].status}</span>
                  <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 z-20 w-full p-8 md:p-12">
                <div className="max-w-xl translate-y-4 transform transition-transform duration-500 group-hover:translate-y-0">
                  <div className="pointer-events-none absolute -left-6 -top-32 select-none font-bricolage text-[8rem] font-bold tracking-tighter text-white/5 md:-top-40 md:text-[12rem]">01</div>
                  <h3 className="relative mb-4 font-bricolage text-4xl font-medium tracking-tight text-white md:text-6xl">{prompts[0].name}</h3>
                  <p className="mb-8 max-w-md text-lg font-light leading-relaxed text-white/70 opacity-0 transition-opacity delay-100 duration-500 group-hover:opacity-100">{prompts[0].description || "无描述"}</p>
                  <div className="flex items-center gap-8 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-white/40">
                    <div><span className="mb-1 block text-white">Versions</span>{prompts[0].versionCount}</div>
                  </div>
                </div>
              </div>
            </Link>
          )}
          <div className="flex flex-col gap-6 md:col-span-4 md:row-span-2">
            {[prompts[1], prompts[2]].map((p, i) =>
              p ? (
                <Link key={p.id} href={`/prompts/${p.id}`} className={`group relative flex-1 animate-on-scroll overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-900 shadow-xl transition-all duration-700 hover:border-white/20 delay-${(i + 3) * 100}`}>
                  <div className="absolute inset-0 z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i === 0 ? TEMPLATE.cardImage2 : TEMPLATE.cardImage3} className="h-full w-full object-cover opacity-50 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                  </div>
                  <div className="absolute right-6 top-6 z-20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur group-hover:bg-white group-hover:text-black">
                      <span className="font-bricolage text-sm font-medium">0{i + 2}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 z-20 w-full p-8">
                    <h3 className="font-bricolage text-3xl font-medium text-white">{p.name}</h3>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        </div>
        <div className="mt-20 flex justify-center">
          <Link href="/prompts" className="group inline-flex items-center gap-3 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white">
            View Complete Manifest
            <Iconify icon="solar:arrow-right-linear" width="14" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** 子页面底部装饰：堆叠展示模板模块 */
export function TemplateShowcaseFooter() {
  return (
    <>
      <TemplateInfrastructure />
      <TemplateTimeline
        items={[
          { year: "v1", title: "创建 Prompt", description: "初始化第一个 Prompt 版本。", node: "01" },
          { year: "v2", title: "运行评测", description: "对接数据集，生成观察报告。", node: "02" },
          { year: "v3", title: "灰度发布", description: "小流量验证后全量上线。", node: "03" },
        ]}
      />
      <TemplateCoreSystems />
      <TemplateCareers
        jobs={[
          { href: "/reviews", icon: "solar:rocket-2-linear", title: "审核队列", location: "Reviews", dept: "QA", type: "Action" },
          { href: "/releases", icon: "solar:user-heart-linear", title: "灰度发布", location: "Releases", dept: "Ops", type: "Action" },
        ]}
      />
    </>
  );
}
