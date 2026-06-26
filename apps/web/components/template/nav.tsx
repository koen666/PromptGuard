"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "@/components/auth-status";
import { NAV_LINKS } from "./constants";
import { Iconify } from "./iconify";

export function TemplateNav() {
  const pathname = usePathname();
  const activeLink = NAV_LINKS.find((link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) ?? NAV_LINKS[0];

  return (
    <>
      <header className="fixed left-3 right-3 top-3 z-50 h-12 rounded-lg border border-white/[0.08] bg-[#151819]/92 shadow-[0_14px_42px_rgba(0,0,0,0.24)] backdrop-blur-xl md:left-[92px]">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="h-5 w-px bg-white/10" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">PromptGuard</div>
              <div className="text-[11px] text-white/[0.42]">{activeLink.label}</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-white/[0.08] bg-black/[0.18] px-2 py-1 text-xs text-white/[0.46] lg:flex">
            <Iconify icon="solar:shield-network-linear" width="15" />
            <span>protected runtime</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <select
                className="h-8 rounded-md border border-white/10 bg-[#202425] px-2 text-xs text-white/70 outline-none"
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
            <AuthStatus />
          </div>
        </div>
      </header>

      <aside className="fixed bottom-3 left-3 top-3 z-40 hidden w-[72px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#151819]/92 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-2xl md:block">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]" />
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/18" />

        <div className="relative flex h-full flex-col items-center py-4">
          <Link
            href="/"
            className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.08] text-[#f3f0df] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl"
            title="PromptGuard"
          >
            <Iconify icon="solar:shield-keyhole-bold-duotone" width="23" />
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-2">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-label={link.label}
                  className={
                    active
                      ? "flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.16] bg-white/[0.12] text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                      : "flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-white/[0.54] transition hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="22" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 h-2 w-2 rounded-full border border-white/[0.28] bg-[#d6c985] shadow-[0_0_18px_rgba(214,201,133,0.52)]" />
        </div>
      </aside>
    </>
  );
}
