import Link from "next/link";
import { notFound } from "next/navigation";
import { getSecurityScan } from "@promptguard/core";
import { TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";

loadEnv();

export default async function SecurityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getSecurityScan(id);
  if (!scan) notFound();

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="Security"
          title="扫描详情"
          titleMuted={scan.passed ? "通过" : "风险"}
          action={<Link href="/security" className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/10">返回安全</Link>}
        />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs text-white/40">风险分</div>
            <div className="mt-2 text-2xl font-semibold text-white">{scan.riskScore?.toFixed(2) ?? "-"}</div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs text-white/40">状态</div>
            <div className="mt-2 text-2xl font-semibold text-white">{scan.status}</div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs text-white/40">Provider</div>
            <div className="mt-2 text-2xl font-semibold text-white">{scan.provider}</div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs text-white/40">时间</div>
            <div className="mt-2 text-sm font-semibold text-white">{formatDate(scan.createdAt)}</div>
          </div>
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="风险发现" description="Prompt 正文静态扫描与诱导泄露测试，证据已脱敏。">
        {scan.findings.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">没有发现风险</p>
        ) : (
          scan.findings.map((finding, i) => (
            <TemplateListItem
              key={finding.id}
              index={i}
              icon="solar:shield-warning-linear"
              name={finding.testName}
              sub={finding.riskLevel}
              specs={[
                { label: "通过", value: finding.passed ? "是" : "否" },
                { label: "说明", value: finding.description },
                { label: "证据", value: finding.modelOutput || "—" },
              ]}
              tier={finding.passed ? "Pass" : "Fail"}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}
