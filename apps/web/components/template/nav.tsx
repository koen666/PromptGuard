"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "@/components/auth-status";
import { NAV_LINKS } from "./constants";
import { Iconify } from "./iconify";

export function TemplateNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/88 backdrop-blur">
      <nav className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
            <Iconify icon="solar:planet-bold-duotone" width="18" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PromptGuard</span>
        </Link>

        <div className="hidden items-center gap-1 text-sm font-medium text-white/60 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "rounded-md bg-white/10 px-3 py-2 text-white"
                    : "rounded-md px-3 py-2 transition-colors hover:bg-white/5 hover:text-white"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <select
            className="rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-white/70 outline-none"
            value={NAV_LINKS.find((l) => pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)))?.href ?? "/"}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
          >
            {NAV_LINKS.map((l) => (
              <option key={l.href} value={l.href}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <AuthStatus />
      </nav>
    </div>
  );
}
