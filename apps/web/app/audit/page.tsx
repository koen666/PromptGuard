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
        <TemplateSectionHeader tag="日志" title="审计轨迹" titleMuted="审计" />

        <Panel>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">日志总数</div>
              <div className="mt-2 text-2xl font-semibold text-white">{logs.length}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">最近动作</div>
              <div className="mt-2 text-sm text-white">{logs[0] ? formatAuditAction(logs[0].action) : "暂无"}</div>
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
              name={formatAuditAction(l.action)}
              sub={formatEntityType(l.entityType)}
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
    return `报告/${detail.split("/reports/").at(-1)}`;
  }
  return detail.length > 72 ? `${detail.slice(0, 72)}…` : detail;
}

function formatAuditAction(action: string) {
  const map: Record<string, string> = {
    approve_review: "通过审核",
    create_dataset: "创建数据集",
    create_prompt: "创建提示词",
    create_release: "创建灰度发布",
    create_report: "生成报告",
    create_review: "提交审核",
    create_security_scan: "创建安全扫描",
    reject_review: "驳回审核",
    rollback_prompt: "回滚提示词",
    update_settings: "更新设置",
  };
  return map[action] ?? action;
}

function formatEntityType(entityType: string) {
  const map: Record<string, string> = {
    audit: "审计",
    dataset: "数据集",
    evaluation: "评测",
    prompt: "提示词",
    release: "发布",
    report: "报告",
    review: "审核",
    security: "安全扫描",
    settings: "设置",
  };
  return map[entityType] ?? entityType;
}
