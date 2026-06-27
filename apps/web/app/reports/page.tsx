import Link from "next/link";
import {
  listEvaluationRuns,
  listGrayReleases,
  listReportRecords,
  listSecurityScans,
} from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import {
  Panel,
  getStatusLabel,
  StatusPill,
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { Iconify } from "@/components/template/iconify";

loadEnv();

export default async function ReportsPage() {
  const [records, runs, scans, releases] = await Promise.all([
    listReportRecords(),
    listEvaluationRuns(),
    listSecurityScans(),
    listGrayReleases(),
  ]);

  const completedRuns = runs.filter((run) => run.status === "completed");
  const riskyScans = scans.filter((scan) => !scan.passed);
  const activeReleases = releases.filter((release) => release.status === "active");

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="报告"
          title="报告中心"
          titleMuted="报告"
          action={
            <Link
              href="/evaluations"
              className="inline-flex items-center gap-2 rounded-[16px] border border-white/[0.10] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white"
            >
              <Iconify icon="solar:chart-2-linear" width="17" />
              运行评测
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <ReportStat label="已生成" value={records.length} />
          <ReportStat label="评测报告" value={completedRuns.length} />
          <ReportStat label="风险扫描" value={riskyScans.length} />
          <ReportStat label="活跃灰度" value={activeReleases.length} />
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="已生成报告" description="通过命令行或 Web 操作导出的报告。">
        {records.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">
            暂无已导出的报告。可以先从评测、安全扫描或发布记录进入详情页。
          </p>
        ) : (
          records.map((record, index) => (
            <TemplateListItem
              key={record.id}
              href={`/reports/${record.id}`}
              index={index}
              icon="solar:document-text-linear"
              name={formatReportType(record.type)}
              sub={record.sourceId}
              specs={[
                { label: "格式", value: record.format },
                { label: "文件", value: record.filePath, wide: true },
                { label: "生成时间", value: formatDate(record.createdAt) },
              ]}
              tier={record.type}
            />
          ))
        )}
      </TemplateListSection>

      <TemplateListSection title="评测报告" description="打开已完成评测任务的可读报告。">
        {runs.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无评测任务</p>
        ) : (
          runs.map((run, index) => (
            <TemplateListItem
              key={run.id}
              href={`/reports/${run.id}`}
              index={index}
              icon="solar:chart-2-linear"
              name={run.id}
              sub={run.status}
              specs={[
                { label: "均分", value: run.avgScore?.toFixed(2) ?? "-" },
                { label: "Token数", value: String(run.totalTokens ?? 0) },
                { label: "成本", value: `$${(run.totalCost ?? 0).toFixed(4)}` },
                { label: "创建时间", value: formatDate(run.createdAt) },
              ]}
              tier={run.status}
            />
          ))
        )}
      </TemplateListSection>

      <TemplateListSection title="安全报告" description="查看扫描发现与优化证据。">
        {scans.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无安全扫描</p>
        ) : (
          scans.map((scan, index) => (
            <TemplateListItem
              key={scan.id}
              href={`/reports/${scan.id}?type=security`}
              index={index}
              icon="solar:shield-check-linear"
              name={scan.id}
              sub={scan.passed ? "passed" : "risk"}
              specs={[
                { label: "风险分", value: scan.riskScore?.toFixed(2) ?? "-" },
                { label: "提供商", value: scan.provider },
                { label: "状态", value: getStatusLabel(scan.status) },
                { label: "创建时间", value: formatDate(scan.createdAt) },
              ]}
              tier={scan.passed ? "Pass" : "Risk"}
            />
          ))
        )}
      </TemplateListSection>

      <TemplateListSection title="发布报告" description="打开灰度发布观察指标和告警样本。">
        {releases.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无发布记录</p>
        ) : (
          releases.map((release, index) => (
            <TemplateListItem
              key={release.id}
              href={`/reports/${release.id}?type=release`}
              index={index}
              icon="solar:rocket-2-linear"
              name={`${release.trafficPercent}% 灰度发布`}
              sub={release.status}
              specs={[
                { label: "观察分", value: release.observationScore?.toFixed(2) ?? "-" },
                { label: "延迟", value: `${release.observationLatencyMs ?? "-"}ms` },
                { label: "成本", value: `$${(release.observationCost ?? 0).toFixed(4)}` },
                { label: "创建时间", value: formatDate(release.createdAt) },
              ]}
              tier={release.status}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}

function formatReportType(type: string) {
  if (type === "evaluation") return "评测报告";
  if (type === "security") return "安全报告";
  if (type === "release") return "发布报告";
  if (type === "audit") return "审计报告";
  if (type === "diff") return "版本差异报告";
  return type;
}

function ReportStat({ label, value }: { label: string; value: number }) {
  return (
    <Panel className="min-h-[120px]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">{label}</div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold text-white">{value}</div>
        <StatusPill value={value > 0 ? "ready" : "empty"} />
      </div>
    </Panel>
  );
}
