import { listUsers } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { requireWebPermission } from "@/lib/auth";
import { Iconify } from "@/components/template/iconify";
import { Panel, StatusPill, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { UserCreateForm } from "./user-create-form";

loadEnv();

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  engineer: "工程",
  reviewer: "审核",
  release_manager: "发布",
  viewer: "只读",
};

export default async function UsersPage() {
  try {
    await requireWebPermission("user:manage");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Permission denied";
    return (
      <TemplatePageWrap>
        <TemplateSectionHeader tag="账号" title="用户管理" titleMuted="权限" action={<StatusPill value="rejected" />} />
        <Panel>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ff6b92]/25 bg-[#ff6b92]/12 text-[#ff9fba]">
              <Iconify icon="solar:shield-cross-linear" width="20" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">没有用户管理权限</h2>
              <p className="mt-1 text-sm text-white/48">{message}</p>
            </div>
          </div>
        </Panel>
      </TemplatePageWrap>
    );
  }

  const users = await listUsers();
  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    for (const role of user.roles) acc[role] = (acc[role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <TemplatePageWrap>
      <TemplateSectionHeader tag="账号" title="用户管理" titleMuted="权限" action={<StatusPill value="active" />} />

      <div className="grid gap-4 lg:grid-cols-4">
        <Panel className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">账号列表</h2>
              <p className="mt-1 text-xs text-white/42">Web、CLI、审核和发布流程共用同一套服务器账号。</p>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/48">
              {users.length} 个账号
            </span>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-white/[0.07]">
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3 border-b border-white/[0.06] bg-white/[0.035] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/38">
              <span>用户</span>
              <span>显示名称</span>
              <span>角色</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-[1fr_1fr_1.5fr] gap-3 border-b border-white/[0.06] px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{user.username}</div>
                  <div className="mt-1 truncate text-xs text-white/30">{user.id}</div>
                </div>
                <div className="truncate text-sm text-white/64">{user.displayName}</div>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <span key={role} className="rounded-full border border-[#7067ff]/25 bg-[#7067ff]/12 px-2.5 py-1 text-xs font-medium text-[#b9b4ff]">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-base font-semibold text-white">角色分布</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-2.5">
                <span className="text-sm text-white/62">{label}</span>
                <span className="text-sm font-semibold text-white">{roleCounts[role] ?? 0}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <UserCreateForm />
      </div>
    </TemplatePageWrap>
  );
}
