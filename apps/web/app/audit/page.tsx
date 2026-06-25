import { listAuditLogs } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { Panel, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";

loadEnv();

export default async function AuditPage() {
  const logs = await listAuditLogs(100);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Log" title="Audit Trail" titleMuted="审计" />

        <Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">日志总数</div>
              <div className="mt-2 text-2xl font-semibold text-white">{logs.length}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">最近动作</div>
              <div className="mt-2 text-sm text-white">{logs[0]?.action ?? "暂无"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">最近时间</div>
              <div className="mt-2 text-sm text-white">{logs[0] ? formatDate(logs[0].createdAt) : "暂无"}</div>
            </div>
          </div>
        </Panel>
      </TemplatePageWrap>
      <TemplateListSection title="审计日志" description="关键操作记录。">
        {logs.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无日志</p>
        ) : (
          logs.map((l, i) => (
            <TemplateListItem
              key={l.id}
              index={i}
              icon="solar:history-linear"
              name={l.action}
              sub={l.entityType}
              specs={[
                { label: "实体", value: l.entityId.slice(0, 14) + "…" },
                { label: "详情", value: compactAuditDetail(l.detail || "—"), wide: true },
                { label: "时间", value: formatDate(l.createdAt) },
              ]}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}

function compactAuditDetail(detail: string) {
  if (detail.includes("/reports/")) {
    return `reports/${detail.split("/reports/").at(-1)}`;
  }
  return detail.length > 72 ? `${detail.slice(0, 72)}…` : detail;
}
