"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AuthState = "checking" | "allowed" | "public";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(() => (isPublicPath(pathname) ? "public" : "checking"));

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setState("public");
      return;
    }

    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body.user) {
          setState("allowed");
          return;
        }
        window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .catch(() => {
        if (!cancelled) {
          window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (state === "checking") {
    return <div className="min-h-[50vh]" />;
  }

  return <>{children}</>;
}
