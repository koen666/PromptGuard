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
      <header className="fixed left-3 right-3 top-3 z-50 h-12 rounded-lg border border-white/10 bg-[#171a1b]/88 shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-xl md:left-[92px]">
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

      <aside className="fixed bottom-3 left-3 top-3 z-40 hidden w-[68px] rounded-lg border border-white/10 bg-[#181b1c]/86 shadow-[0_20px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl md:block">
        <div className="flex h-full flex-col items-center py-4">
          <Link
            href="/"
            className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#f3f0df] text-[#101112] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
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
                      ? "flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "flex h-11 w-11 items-center justify-center rounded-lg text-white/[0.48] transition hover:bg-white/[0.07] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="22" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 h-1.5 w-1.5 rounded-full bg-[#d6c985]" />
        </div>
      </aside>
    </>
  );
}
