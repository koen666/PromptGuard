import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvaluationRun, getPrompt, getReview, getSecurityScan } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Iconify } from "@/components/template/iconify";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader, getStatusLabel } from "@/components/template/sections";
import { ReviewActions } from "../actions";

loadEnv();

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();

  const [prompt, evaluation, security] = await Promise.all([
    getPrompt(review.promptId),
    review.evaluationRunId ? getEvaluationRun(review.evaluationRunId) : Promise.resolve(null),
    review.securityScanId ? getSecurityScan(review.securityScanId) : Promise.resolve(null),
  ]);
  const version = prompt?.versions.find((item) => item.id === review.promptVersionId);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="审核"
          title="审核详情"
          titleMuted={getStatusLabel(review.status)}
          action={
            <Link href="/reviews" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <Iconify icon="solar:arrow-left-linear" width="17" />
              返回队列
            </Link>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel>
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.14em] text-white/35">提示词资产</div>
                <h2 className="mt-2 truncate text-2xl font-semibold text-white">{prompt?.name ?? review.promptId}</h2>
                <p className="mt-2 text-sm text-white/45">版本 v{version?.versionNumber ?? "-"} · {getStatusLabel(version?.status ?? "unknown")}</p>
              </div>
              <StatusPill value={review.status} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <EvidenceCard label="提交人" value={review.submittedBy ?? "—"} />
              <EvidenceCard label="审核人" value={review.reviewedBy ?? "—"} />
              <EvidenceCard label="提交时间" value={formatDate(review.createdAt)} />
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-white/35">备注</div>
              <p className="mt-2 text-sm leading-6 text-white/68">{review.comment || "—"}</p>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold text-white">审核操作</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">确认评测和安全证据后，通过或驳回该版本。</p>
            <div className="mt-4">
              {review.status === "pending" ? (
                <ReviewActions reviewId={review.id} />
              ) : (
                <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/60">
                  当前记录已处理，无需重复操作。
                </div>
              )}
            </div>
          </Panel>
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="审核证据" description="版本变更必须同时绑定评测结果和安全扫描。">
        <TemplateListItem
          href={evaluation ? `/reports/${evaluation.id}` : undefined}
          index={0}
          icon="solar:chart-2-linear"
          name="评测报告"
          sub={evaluation?.status ?? "missing"}
          specs={[
            { label: "任务", value: evaluation?.id ?? "—" },
            { label: "均分", value: evaluation?.avgScore?.toFixed(2) ?? "—" },
            { label: "提供商", value: evaluation?.provider ?? "—" },
            { label: "时间", value: evaluation ? formatDate(evaluation.createdAt) : "—" },
          ]}
          tier={evaluation?.status ?? "missing"}
        />
        <TemplateListItem
          href={security ? `/security/${security.id}` : undefined}
          index={1}
          icon="solar:shield-warning-linear"
          name="安全扫描"
          sub={security?.passed ? "passed" : "risk"}
          specs={[
            { label: "扫描", value: security?.id ?? "—" },
            { label: "风险分", value: security?.riskScore?.toFixed(2) ?? "—" },
            { label: "提供商", value: security?.provider ?? "—" },
            { label: "发现", value: String(security?.findings.length ?? 0) },
          ]}
          tier={security?.passed ? "Pass" : "Fail"}
        />
        <TemplateListItem
          href={prompt ? `/prompts/${prompt.id}/diff` : undefined}
          index={2}
          icon="solar:document-text-linear"
          name="版本差异"
          sub={version ? `v${version.versionNumber}` : "missing"}
          specs={[
            { label: "提示词", value: prompt?.id ?? review.promptId },
            { label: "版本", value: version ? String(version.versionNumber) : "—" },
            { label: "状态", value: version?.status ?? "—" },
            { label: "变更说明", value: version?.changelog ?? "—" },
          ]}
          tier={version?.status ?? "version"}
        />
      </TemplateListSection>
    </>
  );
}

function EvidenceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</div>
      <div className="mt-2 truncate text-sm font-semibold text-white/78" title={value}>{value}</div>
    </div>
  );
}
