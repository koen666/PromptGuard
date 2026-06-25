import { listReviews } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { ReviewActions } from "./actions";

loadEnv();

export default async function ReviewsPage() {
  const reviews = await listReviews();
  const pending = reviews.filter((r) => r.status === "pending").length;
  const approved = reviews.filter((r) => r.status === "approved").length;
  const rejected = reviews.filter((r) => r.status === "rejected").length;

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Review" title="审核队列" titleMuted="Review" action={<StatusPill value={pending ? "pending" : "clear"} />} />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel>
            <h3 className="text-lg font-semibold text-white">评审依据</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">审核前应同时查看版本 Diff、评测报告、安全扫描和变更说明。当前页面先聚合队列和处理动作。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {["版本 Diff", "评测报告", "安全风险", "审核意见"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/65">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h3 className="text-lg font-semibold text-white">队列统计</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/45">待审核</span><span className="text-white">{pending}</span></div>
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/45">已通过</span><span className="text-white">{approved}</span></div>
              <div className="flex justify-between"><span className="text-white/45">已驳回</span><span className="text-white">{rejected}</span></div>
            </div>
          </Panel>
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="审核队列" description="人工审核 Prompt 版本变更。">
        {reviews.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无审核记录</p>
        ) : (
          reviews.map((r, i) => (
            <div key={r.id} className="grid border-b border-white/10 last:border-b-0 md:grid-cols-[1fr_auto]">
              <TemplateListItem
                index={i}
                icon="solar:clipboard-check-linear"
                name={`Prompt ${r.promptId.slice(0, 12)}…`}
                sub={r.status}
	                specs={[
	                  { label: "提交人", value: r.submittedBy ?? "—" },
	                  { label: "评测", value: r.evaluationRunId?.slice(0, 12) + "…" || "—" },
	                  { label: "安全", value: r.securityScanId?.slice(0, 12) + "…" || "—" },
	                  { label: "时间", value: formatDate(r.createdAt) },
	                  { label: "备注", value: r.comment || "—" },
	                ]}
                tier={r.status}
              />
              {r.status === "pending" && (
                <div className="flex items-center justify-start px-4 pb-4 md:justify-end md:pb-0">
                  <ReviewActions reviewId={r.id} />
                </div>
              )}
            </div>
          ))
        )}
      </TemplateListSection>
    </>
  );
}
