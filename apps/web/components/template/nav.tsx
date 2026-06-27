"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "@/components/auth-status";
import { NAV_LINKS } from "./constants";
import { Iconify } from "./iconify";

export function TemplateNav() {
  const pathname = usePathname();
  const activeLink = NAV_LINKS.find((link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) ?? NAV_LINKS[0];
  const secondaryLinks = NAV_LINKS.slice(6);
  const primaryLinks = NAV_LINKS.slice(0, 6);

  return (
    <>
      <header className="fixed left-3 right-3 top-3 z-50 h-14 rounded-[22px] border border-white/[0.07] bg-[#1b1c22]/88 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:left-[304px]">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-4 w-4 rounded-full border-2 border-[#7067ff] shadow-[0_0_22px_rgba(112,103,255,0.65)]" />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">{activeLink.label}</div>
              <div className="truncate text-[11px] text-white/36">Website / Apps / PromptGuard</div>
            </div>
          </div>

          <div className="hidden min-w-[280px] max-w-md flex-1 items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111217]/78 px-4 py-2 text-sm text-white/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex">
            <Iconify icon="solar:magnifer-linear" width="18" />
            <span className="truncate">Type to search</span>
            <Iconify icon="solar:microphone-2-linear" width="17" />
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <select
                className="h-9 rounded-2xl border border-white/10 bg-[#202127] px-3 text-xs text-white/70 outline-none"
                value={activeLink.href}
                onChange={(event) => {
                  window.location.href = event.target.value;
                }}
              >
                {NAV_LINKS.map((link) => (
                  <option key={link.href} value={link.href}>
                    {link.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/62 transition hover:bg-white/[0.08] hover:text-white sm:flex" aria-label="Notifications">
              <Iconify icon="solar:bell-linear" width="19" />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/62 transition hover:bg-white/[0.08] hover:text-white sm:flex" aria-label="Export">
              <Iconify icon="solar:upload-square-linear" width="19" />
            </button>
            <button className="hidden rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#17181d] shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition hover:bg-[#f4f2ff] lg:inline-flex">
              Share
            </button>
            <AuthStatus />
          </div>
        </div>
      </header>

      <aside className="fixed bottom-3 left-3 top-3 z-40 hidden w-[276px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#202127]/92 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:block">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))]" />
        <div className="relative flex h-full flex-col p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#67e8f9,#7067ff)] text-lg font-bold text-white shadow-[0_16px_34px_rgba(112,103,255,0.34)]">
              PG
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">Walter</div>
              <div className="truncate text-xs text-white/38">Prompt Designer Pro</div>
            </div>
            <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/24 text-white/42 transition hover:text-white" aria-label="Settings">
              <Iconify icon="solar:settings-minimalistic-linear" width="16" />
            </button>
          </div>

          <div className="mb-5 flex items-center gap-2 rounded-[18px] border border-white/[0.07] bg-[#14151a]/88 px-3 py-3 text-sm text-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
            <Iconify icon="solar:magnifer-linear" width="18" />
            <span className="truncate">Redesign App</span>
            <Iconify className="ml-auto text-[#ffe36e]" icon="solar:star-bold" width="15" />
          </div>

          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/28">Overview</div>
          <nav className="space-y-1.5">
            {primaryLinks.map((link, index) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-label={link.label}
                  className={
                    active
                      ? "flex h-11 items-center gap-3 rounded-[16px] bg-[#7067ff] px-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(112,103,255,0.38)]"
                      : "flex h-11 items-center gap-3 rounded-[16px] px-3 text-sm font-medium text-white/58 transition hover:bg-white/[0.05] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="19" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {active ? <Iconify icon="solar:alt-arrow-up-linear" width="15" /> : index === 1 ? <span className="h-2 w-2 rounded-full bg-[#ff765f]" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-1.5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/28">Workspace</div>
            {secondaryLinks.map((link, index) => {
              const active = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "flex h-10 items-center gap-3 rounded-[15px] bg-white/[0.08] px-3 text-sm font-medium text-white"
                      : "flex h-10 items-center gap-3 rounded-[15px] px-3 text-sm font-medium text-white/48 transition hover:bg-white/[0.05] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="18" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {index === 0 && <span className="rounded-full bg-[#262832] px-2 py-0.5 text-[11px] text-[#ffe36e]">4</span>}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between rounded-[18px] border border-white/[0.07] bg-[#16171d] p-2">
              {["solar:document-text-linear", "solar:chart-square-linear", "solar:bookmark-linear"].map((icon) => (
                <button key={icon} className="flex h-9 w-9 items-center justify-center rounded-[13px] text-white/46 transition hover:bg-white/[0.06] hover:text-white">
                  <Iconify icon={icon} width="17" />
                </button>
              ))}
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7067ff] text-white shadow-[0_10px_22px_rgba(112,103,255,0.38)]">
                <Iconify icon="solar:moon-fog-linear" width="18" />
              </button>
            </div>
            <Link href="/prompts" className="flex h-[120px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/18 bg-[#15161b]/72 text-center transition hover:border-[#7067ff]/55 hover:bg-[#1c1d26]">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#7067ff] text-white shadow-[0_12px_26px_rgba(112,103,255,0.42)]">
                <Iconify icon="solar:add-circle-linear" width="21" />
              </span>
              <span className="text-sm font-medium text-white">Add New Prompt</span>
              <span className="mt-1 text-xs text-white/36">Or use import link</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
