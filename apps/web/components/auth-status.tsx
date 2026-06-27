"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CurrentUser = {
  username: string;
  roles: string[];
};

export function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((body) => setUser(body.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  if (!user) {
    return (
      <Link href="/login" className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white">
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white/52 xl:inline">{user.username} · {user.roles.join(",")}</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
      >
        退出
      </button>
    </div>
  );
}
