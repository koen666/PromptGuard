import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { getReportsDir } from "../config.js";
import { getDb } from "../db/client.js";
import { reportRecords } from "../db/schema.js";
import { createId } from "../utils/id.js";
import { maskSensitiveText } from "../utils/redaction.js";
import { exportAuditLogs, listAuditLogs, logAudit } from "./audit.js";
import { getEvaluationComparison, getEvaluationRun } from "./evaluation.js";
import { getVersionDiff } from "./prompt.js";
import { getReleaseObservation, listGrayReleases } from "./release.js";
import { getSecurityScan } from "./security.js";

export type ReportType = "evaluation" | "diff" | "security" | "release" | "audit";
export type ReportFormat = "json" | "html";

export interface ReportData {
  id: string;
  type: ReportType;
  sourceId: string;
  generatedAt: string;
  evaluation?: Awaited<ReturnType<typeof getEvaluationRun>>;
  diff?: Awaited<ReturnType<typeof getVersionDiff>>;
  comparison?: Awaited<ReturnType<typeof getEvaluationComparison>>;
  security?: Awaited<ReturnType<typeof getSecurityScan>>;
  release?: Awaited<ReturnType<typeof getReleaseObservation>>;
  audit?: Awaited<ReturnType<typeof listAuditLogs>>;
  grayReleases?: Awaited<ReturnType<typeof listGrayReleases>>;
}

export async function buildReport(input: {
  type: ReportType;
  sourceId: string;
  promptId?: string;
  fromVersion?: number;
  toVersion?: number;
}): Promise<ReportData> {
  const report: ReportData = {
    id: createId("report"),
    type: input.type,
    sourceId: input.sourceId,
    generatedAt: new Date().toISOString(),
  };

  if (input.type === "evaluation") {
    const evaluation = await getEvaluationRun(input.sourceId);
    if (!evaluation) throw new Error("Evaluation run not found");
    report.evaluation = evaluation;
    return report;
  }

  if (input.type === "diff") {
    if (!input.promptId || input.fromVersion == null || input.toVersion == null) {
      throw new Error("Diff report requires promptId, fromVersion, and toVersion");
    }
    report.diff = await getVersionDiff(input.promptId, input.fromVersion, input.toVersion);
    report.sourceId = `${input.promptId}:${input.fromVersion}:${input.toVersion}`;
    return report;
  }

  if (input.type === "security") {
    const security = await getSecurityScan(input.sourceId);
    if (!security) throw new Error("Security scan not found");
    report.security = security;
    return report;
  }

  if (input.type === "release") {
    const release = await getReleaseObservation(input.sourceId);
    if (!release) throw new Error("Release not found");
    report.release = release;
    return report;
  }

  report.audit = await listAuditLogs(500);
  report.grayReleases = await listGrayReleases();
  return report;
}

export async function buildReportFromEvaluation(runId: string): Promise<ReportData> {
  return buildReport({ type: "evaluation", sourceId: runId });
}

export async function generateReportHtml(report: ReportData): Promise<string> {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>PromptGuard ${report.type} Report ${report.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0a0a0a; color: #f6f6f6; padding: 40px; max-width: 1100px; margin: 0 auto; }
    h1 { color: #34d399; }
    section { background: #151515; border: 1px solid #2a2a2a; border-radius: 8px; padding: 22px; margin: 18px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #2a2a2a; padding: 10px; text-align: left; vertical-align: top; }
    th { color: #a7f3d0; }
    pre { white-space: pre-wrap; word-break: break-word; background: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 6px; padding: 14px; }
  </style>
</head>
<body>
  <h1>PromptGuard ${escapeHtml(report.type)} 报告</h1>
  <p>Report ID: ${report.id}</p>
  <p>Source ID: ${escapeHtml(report.sourceId)}</p>
  <p>生成时间: ${report.generatedAt}</p>
  ${renderEvaluationSection(report)}
  ${renderDiffSection(report)}
  ${renderSecuritySection(report)}
  ${renderReleaseSection(report)}
  ${renderAuditSection(report)}
</body>
</html>`;
}

export async function exportReport(
  sourceId: string,
  format: ReportFormat = "json",
  options: { type?: ReportType; promptId?: string; fromVersion?: number; toVersion?: number; actor?: string } = {},
) {
  const type = options.type ?? "evaluation";
  const report = await buildReport({
    type,
    sourceId,
    promptId: options.promptId,
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
  });
  const dir = getReportsDir();
  fs.mkdirSync(dir, { recursive: true });

  const safeSource = report.sourceId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const baseName = `${type}_${safeSource}_${Date.now()}`;
  const filePath = path.join(dir, `${baseName}.${format}`);
  const displayPath = path.join("reports", `${baseName}.${format}`);

  if (format === "html") {
    fs.writeFileSync(filePath, await generateReportHtml(report), "utf-8");
  } else if (type === "audit") {
    fs.writeFileSync(filePath, await exportAuditLogs("json", 500), "utf-8");
  } else {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf-8");
  }

  await recordReport({
    id: report.id,
    type,
    sourceId: report.sourceId,
    format,
    filePath: displayPath,
    generatedBy: options.actor,
  });

  await logAudit({
    action: "report_export",
    entityType: "report",
    entityId: report.id,
    actor: options.actor,
    detail: `${type} ${displayPath}`,
  });

  return { report, filePath };
}

export async function listReportRecords(limit = 100) {
  const db = getDb();
  return db.select().from(reportRecords).orderBy(desc(reportRecords.createdAt)).limit(limit);
}

async function recordReport(input: {
  id: string;
  type: ReportType;
  sourceId: string;
  format: ReportFormat;
  filePath: string;
  generatedBy?: string;
}) {
  const db = getDb();
  await db.insert(reportRecords).values({
    id: input.id,
    type: input.type,
    sourceId: input.sourceId,
    format: input.format,
    filePath: input.filePath,
    generatedBy: input.generatedBy ?? "system",
  });
}

function renderEvaluationSection(report: ReportData) {
  if (!report.evaluation) return "";
  const run = report.evaluation;
  return `
    <section>
      <h2>评测摘要</h2>
      <p>平均分: ${run.avgScore?.toFixed(2) ?? "N/A"}</p>
      <p>Provider: ${escapeHtml(run.provider)}</p>
      <p>总 Token: ${run.totalTokens ?? 0}</p>
      <p>总成本: $${(run.totalCost ?? 0).toFixed(4)}</p>
      <p>错误: ${escapeHtml(maskSensitiveText(run.errorMessage ?? "无"))}</p>
      <table>
        <tr><th>Model</th><th>Relevance</th><th>Format</th><th>Latency</th><th>Token</th><th>Cost</th><th>Passed</th><th>Error</th></tr>
        ${run.results.map((r) => `<tr><td>${escapeHtml(r.model)}</td><td>${r.relevanceScore.toFixed(2)}</td><td>${r.formatScore.toFixed(2)}</td><td>${r.latencyMs}ms</td><td>${r.tokenCount ?? 0}</td><td>$${(r.cost ?? 0).toFixed(5)}</td><td>${r.passed ? "pass" : "fail"}</td><td>${escapeHtml(maskSensitiveText(r.errorMessage ?? ""))}</td></tr>`).join("")}
      </table>
    </section>`;
}

function renderDiffSection(report: ReportData) {
  if (!report.diff) return "";
  return `
    <section>
      <h2>版本 Diff</h2>
      <p>v${report.diff.from.versionNumber} -> v${report.diff.to.versionNumber}</p>
      <pre>${escapeHtml(maskSensitiveText(report.diff.patch))}</pre>
    </section>`;
}

function renderSecuritySection(report: ReportData) {
  if (!report.security) return "";
  return `
    <section>
      <h2>安全扫描</h2>
      <p>风险分: ${report.security.riskScore?.toFixed(2) ?? "-"}</p>
      <p>通过: ${report.security.passed ? "是" : "否"}</p>
      <table>
        <tr><th>Finding</th><th>Risk</th><th>Passed</th><th>Evidence</th></tr>
        ${report.security.findings.map((f) => `<tr><td>${escapeHtml(f.testName)}</td><td>${f.riskLevel}</td><td>${f.passed ? "pass" : "fail"}</td><td>${escapeHtml(maskSensitiveText(f.modelOutput))}</td></tr>`).join("")}
      </table>
    </section>`;
}

function renderReleaseSection(report: ReportData) {
  if (!report.release) return "";
  return `
    <section>
      <h2>发布观察</h2>
      <p>Release: ${report.release.release.id}</p>
      <p>状态: ${report.release.release.status}</p>
      <p>流量: ${report.release.release.trafficPercent}%</p>
      <table>
        <tr><th>Metric</th><th>Value</th><th>Unit</th><th>Time</th></tr>
        ${report.release.samples.map((s) => `<tr><td>${s.metric}</td><td>${s.value.toFixed(4)}</td><td>${s.unit ?? ""}</td><td>${s.sampledAt}</td></tr>`).join("")}
      </table>
      <h3>告警</h3>
      <table>
        <tr><th>Severity</th><th>Metric</th><th>Value</th><th>Message</th></tr>
        ${report.release.alerts.map((a) => `<tr><td>${a.severity}</td><td>${a.metric}</td><td>${a.value.toFixed(4)}</td><td>${escapeHtml(a.message)}</td></tr>`).join("")}
      </table>
    </section>`;
}

function renderAuditSection(report: ReportData) {
  if (!report.audit) return "";
  return `
    <section>
      <h2>审计导出</h2>
      <table>
        <tr><th>Action</th><th>Entity</th><th>Actor</th><th>Detail</th><th>Time</th></tr>
        ${report.audit.map((l) => `<tr><td>${escapeHtml(l.action)}</td><td>${escapeHtml(l.entityType)}:${escapeHtml(l.entityId)}</td><td>${escapeHtml(l.actor ?? "")}</td><td>${escapeHtml(maskSensitiveText(l.detail ?? ""))}</td><td>${l.createdAt}</td></tr>`).join("")}
      </table>
    </section>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
