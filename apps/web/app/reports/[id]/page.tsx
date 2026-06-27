import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildReport,
  getReportRecord,
  type ReportData,
  type ReportType,
} from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import {
  Panel,
  StatusPill,
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { Iconify } from "@/components/template/iconify";

loadEnv();

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const report = await resolveReport(id, normalizeReportType(type));
  if (!report) notFound();

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="报告"
          title={reportTitle(report)}
          titleMuted={formatReportType(report.type)}
          action={
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-[16px] border border-white/[0.10] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white"
            >
              <Iconify icon="solar:arrow-left-linear" width="17" />
              返回报告
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="类型" value={formatReportType(report.type)} />
          <SummaryCard label="来源" value={report.sourceId} wide />
          <SummaryCard label="生成时间" value={formatDate(report.generatedAt)} />
          <SummaryCard label="报告 ID" value={report.id} wide />
        </div>

        {report.evaluation && <EvaluationReport report={report} />}
        {report.security && <SecurityReport report={report} />}
        {report.release && <ReleaseReport report={report} />}
        {report.audit && <AuditReport report={report} />}
        {report.diff && <DiffReport report={report} />}
      </TemplatePageWrap>

      {report.evaluation && (
        <TemplateListSection title="评测样本" description="模型输出和评分明细。">
          {report.evaluation.results.length === 0 ? (
            <p className="px-4 py-6 text-center text-white/40">暂无样本结果</p>
          ) : (
            report.evaluation.results.map((result, index) => (
              <TemplateListItem
                key={result.id}
                index={index}
                icon="solar:chart-2-linear"
                name={result.model}
                sub={result.passed ? "passed" : "failed"}
                specs={[
                  { label: "相关性", value: result.relevanceScore.toFixed(2) },
                  { label: "格式", value: result.formatScore.toFixed(2) },
                  { label: "延迟", value: `${result.latencyMs}ms` },
                  { label: "输出", value: result.errorMessage || result.output || "-", wide: true },
                ]}
                tier={result.passed ? "Pass" : "Fail"}
              />
            ))
          )}
        </TemplateListSection>
      )}
    </>
  );
}

async function resolveReport(id: string, requestedType?: ReportType): Promise<ReportData | null> {
  try {
    if (requestedType) return buildReport({ type: requestedType, sourceId: requestedType === "audit" ? "audit" : id });

    const record = await getReportRecord(id);
    if (record) {
      if (record.type === "diff") {
        const [promptId, from, to] = record.sourceId.split(":");
        return buildReport({
          type: "diff",
          sourceId: record.sourceId,
          promptId,
          fromVersion: Number(from),
          toVersion: Number(to),
        });
      }
      return buildReport({ type: record.type, sourceId: record.type === "audit" ? "audit" : record.sourceId });
    }

    if (id.startsWith("eval_")) return buildReport({ type: "evaluation", sourceId: id });
    if (id.startsWith("scan_")) return buildReport({ type: "security", sourceId: id });
    if (id.startsWith("gray_")) return buildReport({ type: "release", sourceId: id });
    if (id === "audit") return buildReport({ type: "audit", sourceId: "audit" });
    return null;
  } catch {
    return null;
  }
}

function normalizeReportType(value?: string): ReportType | undefined {
  if (value === "evaluation" || value === "security" || value === "release" || value === "audit" || value === "diff") {
    return value;
  }
  return undefined;
}

function reportTitle(report: ReportData) {
  if (report.type === "evaluation") return "评测报告";
  if (report.type === "security") return "安全报告";
  if (report.type === "release") return "发布报告";
  if (report.type === "audit") return "审计报告";
  return "版本差异报告";
}

function formatReportType(type: string) {
  if (type === "evaluation") return "评测";
  if (type === "security") return "安全";
  if (type === "release") return "发布";
  if (type === "audit") return "审计";
  if (type === "diff") return "版本差异";
  return type;
}

function formatMetricName(metric: string) {
  const map: Record<string, string> = {
    observation_score: "观察分",
    latency_ms: "延迟",
    cost_usd: "成本",
    pass_rate: "通过率",
    risk_score: "风险分",
  };
  return map[metric] ?? metric;
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

function SummaryCard({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <Panel className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">{label}</div>
      <div className="mt-3 truncate text-sm font-semibold text-white/78" title={value}>{value}</div>
    </Panel>
  );
}

function EvaluationReport({ report }: { report: ReportData }) {
  const run = report.evaluation;
  if (!run) return null;
  const passCount = run.results.filter((result) => result.passed).length;

  return (
    <Panel className="mt-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">评测摘要</h3>
          <p className="mt-1 text-sm text-white/45">数据集评分、Token 用量、成本和模型输出。</p>
        </div>
        <StatusPill value={run.status} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="平均分" value={run.avgScore?.toFixed(2) ?? "-"} />
        <Metric label="通过数" value={`${passCount}/${run.results.length}`} />
        <Metric label="Token 数" value={String(run.totalTokens ?? 0)} />
        <Metric label="成本" value={`$${(run.totalCost ?? 0).toFixed(4)}`} />
      </div>
    </Panel>
  );
}

function SecurityReport({ report }: { report: ReportData }) {
  const scan = report.security;
  if (!scan) return null;
  const failedFindings = scan.findings.filter((finding) => !finding.passed).length;

  return (
    <Panel className="mt-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">安全摘要</h3>
          <p className="mt-1 text-sm text-white/45">提示词注入探测、泄露证据和修复建议。</p>
        </div>
        <StatusPill value={scan.passed ? "passed" : "risk"} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="风险分" value={scan.riskScore?.toFixed(2) ?? "-"} />
        <Metric label="发现数" value={String(scan.findings.length)} />
        <Metric label="失败数" value={String(failedFindings)} />
        <Metric label="提供商" value={scan.provider} />
      </div>
      <div className="mt-5 overflow-hidden rounded-[20px] border border-white/[0.07]">
        {scan.findings.map((finding) => (
          <div key={finding.id} className="border-b border-white/[0.06] p-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{finding.testName}</span>
              <StatusPill value={finding.riskLevel} />
              <StatusPill value={finding.passed ? "pass" : "fail"} />
            </div>
            <p className="mt-2 text-sm text-white/55">{finding.description}</p>
            <p className="mt-1 text-sm text-[#d6c985]">{finding.recommendation || "建议保留该用例作为回归测试。"}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReleaseReport({ report }: { report: ReportData }) {
  const release = report.release;
  if (!release) return null;

  return (
    <Panel className="mt-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">发布观察</h3>
          <p className="mt-1 text-sm text-white/45">灰度发布指标和阈值告警。</p>
        </div>
        <StatusPill value={release.release.status} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="流量" value={`${release.release.trafficPercent}%`} />
        <Metric label="观察分" value={release.release.observationScore?.toFixed(2) ?? "-"} />
        <Metric label="延迟" value={`${release.release.observationLatencyMs ?? "-"}ms`} />
        <Metric label="告警" value={String(release.alerts.length)} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {release.samples.slice(0, 8).map((sample) => (
          <div key={sample.id} className="rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-3">
            <div className="text-xs text-white/36">{formatMetricName(sample.metric)}</div>
            <div className="mt-2 text-xl font-semibold text-white">{sample.value.toFixed(4)} {sample.unit}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AuditReport({ report }: { report: ReportData }) {
  const logs = report.audit;
  if (!logs) return null;

  return (
    <Panel className="mt-5">
      <h3 className="text-lg font-semibold text-white">审计导出</h3>
      <p className="mt-1 text-sm text-white/45">近期系统操作和操作者。</p>
      <div className="mt-5 overflow-hidden rounded-[20px] border border-white/[0.07]">
        {logs.slice(0, 30).map((log) => (
          <div key={log.id} className="grid gap-2 border-b border-white/[0.06] p-4 last:border-b-0 md:grid-cols-[180px_1fr_140px]">
            <div className="text-sm font-semibold text-white">{formatAuditAction(log.action)}</div>
            <div className="min-w-0 text-sm text-white/55">
              <span className="block truncate">{formatEntityType(log.entityType)}：{log.entityId}</span>
              <span className="block truncate text-white/35">{log.detail || "-"}</span>
            </div>
            <div className="text-sm text-white/45">{formatDate(log.createdAt)}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DiffReport({ report }: { report: ReportData }) {
  if (!report.diff) return null;

  return (
    <Panel className="mt-5">
      <h3 className="text-lg font-semibold text-white">版本差异</h3>
      <p className="mt-1 text-sm text-white/45">v{report.diff.from.versionNumber} 到 v{report.diff.to.versionNumber}</p>
      <pre className="mt-4 max-h-[560px] overflow-auto whitespace-pre-wrap rounded-[18px] border border-white/[0.07] bg-[#101116] p-4 text-xs leading-5 text-white/68">
        {report.diff.patch}
      </pre>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-3">
      <div className="text-xs text-white/36">{label}</div>
      <div className="mt-2 truncate text-xl font-semibold text-white" title={value}>{value}</div>
    </div>
  );
}
