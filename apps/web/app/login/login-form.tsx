"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? (mode === "login" ? "登录失败" : "注册失败"));
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "login" ? "登录失败" : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mx-auto max-w-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{mode === "login" ? "登录 PromptGuard" : "创建 PromptGuard 账号"}</h2>
        <button
          className="text-xs font-semibold text-white/50 transition hover:text-white"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setUsername("");
            setPassword("");
          }}
        >
          {mode === "login" ? "注册" : "返回登录"}
        </button>
      </div>
      <form className="mt-5 space-y-4" onSubmit={handleLogin}>
        {mode === "register" && (
          <div>
            <FieldLabel>显示名称</FieldLabel>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
          </div>
        )}
        <div>
          <FieldLabel>用户名</FieldLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
        </div>
        <div>
          <FieldLabel>密码</FieldLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button disabled={loading || !username || !password} className="w-full" type="submit">
          {loading ? (mode === "login" ? "登录中..." : "创建中...") : mode === "login" ? "登录" : "创建并登录"}
        </Button>
      </form>
      {mode === "register" && <p className="mt-4 text-xs text-white/35">公开注册账号默认为只读角色，管理员可在用户页调整权限。</p>}
    </Panel>
  );
}
