"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "登录失败");
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mx-auto max-w-md">
      <h2 className="text-lg font-semibold text-white">登录 PromptGuard</h2>
      <div className="mt-5 space-y-4">
        <div>
          <FieldLabel>用户名</FieldLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
        </div>
        <div>
          <FieldLabel>密码</FieldLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button onClick={handleLogin} disabled={loading || !username || !password} className="w-full">
          {loading ? "登录中..." : "登录"}
        </Button>
      </div>
      <p className="mt-4 text-xs text-white/35">默认管理员：admin / promptguard123</p>
    </Panel>
  );
}
