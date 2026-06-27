"use client";

import { usePathname } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { TemplateNav } from "@/components/template/nav";
import { TemplateScrollReveal } from "@/components/template/scroll-reveal";
import { cn } from "@/lib/utils";

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = isLoginPath(pathname);

  return (
    <>
      {!standalone && <TemplateNav />}
      <TemplateScrollReveal />
      <main
        className={cn(
          "relative z-10 min-h-screen",
          standalone ? "px-4" : "px-3 pb-4 pt-[76px] md:pl-[304px]",
        )}
      >
        <AuthGate>{children}</AuthGate>
      </main>
    </>
  );
}
