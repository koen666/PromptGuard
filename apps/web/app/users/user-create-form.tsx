"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer / 只读" },
  { value: "engineer", label: "Engineer / 工程" },
  { value: "reviewer", label: "Reviewer / 审核" },
  { value: "release_manager", label: "Release / 发布" },
  { value: "admin", label: "Admin / 管理员" },
] as const;

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

export function UserCreateForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleValue>("viewer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          password,
          roles: [role],
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "创建用户失败");

      setUsername("");
      setDisplayName("");
      setPassword("");
      setRole("viewer");
      setMessage("用户已创建");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建用户失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">创建账号</h2>
        <p className="mt-1 text-xs text-white/42">新账号会写入服务器 MySQL，并立即参与 Web 与 CLI 权限校验。</p>
      </div>
      <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_180px_auto]" onSubmit={submit}>
        <div>
          <FieldLabel>用户名</FieldLabel>
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="alice" />
        </div>
        <div>
          <FieldLabel>显示名称</FieldLabel>
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Alice" />
        </div>
        <div>
          <FieldLabel>初始密码</FieldLabel>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 位" />
        </div>
        <div>
          <FieldLabel>角色</FieldLabel>
          <Select value={role} onChange={(event) => setRole(event.target.value as RoleValue)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" disabled={loading || !username || password.length < 8} type="submit">
            {loading ? "创建中" : "创建"}
          </Button>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-white/58">{message}</p>}
    </Panel>
  );
}
