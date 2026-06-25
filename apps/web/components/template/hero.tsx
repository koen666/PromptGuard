import Link from "next/link";
import { TEMPLATE } from "./constants";
import { Iconify } from "./iconify";

export function TemplateHero({
  prompts,
  evals,
  pending,
}: {
  prompts: number;
  evals: number;
  pending: number;
}) {
  return (
    <header className="relative flex min-h-screen w-full flex-col justify-end overflow-hidden pb-12 md:h-screen md:pb-24">
      <div className="absolute inset-0 z-0 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TEMPLATE.heroImage}
          className="h-full w-full animate-cinematic object-cover opacity-0"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
      </div>

      <div className="absolute right-6 top-32 z-20 flex animate-slide-up flex-col items-end gap-2 opacity-0 [animation-delay:2.5s] md:right-12">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-wider text-white/90">Live: Mock Provider</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[90rem] grid-cols-1 items-end gap-6 px-6 md:grid-cols-12 md:px-12">
        <div className="relative md:col-span-7">
          <div className="mb-6 flex animate-slide-up items-center gap-3 opacity-0 [animation-delay:1.2s]">
            <span className="h-px w-8 bg-white/60" />
            <span className="font-mono text-xs uppercase tracking-widest text-white/80">Prompt 版本评测</span>
          </div>

          <h1 className="font-bricolage font-semibold leading-[0.85] tracking-tight text-white">
            <span className="animate-slide-up block text-[15vw] text-white opacity-0 mix-blend-normal drop-shadow-2xl [animation-delay:1.4s] md:text-[9rem] lg:text-[11rem]">
              PROMPT
            </span>
            <div className="-mt-2 flex animate-slide-up items-baseline gap-4 opacity-0 [animation-delay:1.6s] md:-mt-8 md:gap-8">
              <span className="font-serif text-[15vw] font-thin italic text-white/60 opacity-50 blur-[1px] md:text-[9rem] lg:text-[11rem]">
                &amp;
              </span>
              <span className="text-[15vw] text-white drop-shadow-2xl md:text-[9rem] lg:text-[11rem]">GUARD</span>
            </div>
          </h1>
        </div>

        <div className="flex flex-col justify-end pb-4 md:col-span-4 md:col-start-9 md:pb-8">
          <div className="animate-slide-up relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/60 p-6 opacity-0 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl [animation-delay:1.8s] md:p-8">
            <div className="animate-shimmer-effect pointer-events-none absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="relative z-10">
              <p className="mb-8 text-lg font-light leading-relaxed text-white antialiased drop-shadow-md md:text-xl">
                Prompt 版本管理、自动评测、安全扫描与灰度发布控制台。
              </p>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                  <div>
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-white/50">Prompts</span>
                    <span className="font-bricolage text-2xl text-white">{prompts}</span>
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-white/50">Evals</span>
                    <span className="font-bricolage text-2xl text-white">{evals}</span>
                  </div>
                </div>

                <Link
                  href="/prompts"
                  className="group flex w-full items-center justify-between border-b border-white/30 p-1 pb-2 transition-colors hover:border-white"
                >
                  <span className="text-sm font-medium tracking-wide text-white">进入 Prompt</span>
                  <Iconify icon="solar:arrow-right-linear" className="text-white transition-transform group-hover:translate-x-1" width="18" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-slide-up flex-col items-center gap-2 opacity-0 [animation-delay:2.2s]">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Scroll</span>
        <div className="h-12 w-px bg-gradient-to-b from-white to-transparent" />
      </div>

      <div className="absolute bottom-8 left-8 z-20 hidden animate-slide-up flex-col gap-2 opacity-0 [animation-delay:2.4s] lg:flex">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
          <span>Sys.Norm</span>
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
          <span>v0.1.0</span>
        </div>
        <div className="w-64 rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-4 backdrop-blur">
          <div className="mb-2 flex justify-between">
            <span className="text-xs text-white/60">待审核</span>
            <span className="text-xs text-emerald-400">{pending}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, pending * 20 + 10)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-white/40">Provider</span>
              <span className="font-mono text-sm text-white">Mock</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-white/40">Status</span>
              <span className="font-mono text-sm text-white">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
