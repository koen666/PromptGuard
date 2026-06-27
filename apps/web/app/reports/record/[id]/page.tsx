import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportsDir, listReportRecords } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { DividerPulse } from "@/components/template/shell";
import { Iconify } from "@/components/template/iconify";
import { TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";

loadEnv();

export default async function ReportRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportRecord(id);
  if (!report) notFound();

  const absPath = path.resolve(getReportsDir(), path.basename(report.filePath));
  const preview = readReportPreview(absPath, report.format);

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="Report"
          title="报告详情"
          titleMuted={report.type}
          action={
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Iconify icon="solar:arrow-left-linear" width="18" />
              返回报告
            </Link>
          }
        />

        <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 md:grid-cols-4">
          <Meta label="类型" value={report.type} />
          <Meta label="来源" value={report.sourceId} />
          <Meta label="格式" value={report.format} />
          <Meta label="时间" value={formatDate(report.createdAt)} />
          <Meta label="生成者" value={report.generatedBy ?? "system"} />
          <Meta label="记录 ID" value={report.id} wide />
          <Meta label="文件" value={report.filePath} wide />
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-neutral-950/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">原始内容</h2>
              <p className="mt-1 text-sm text-white/45">直接打开这份报告文件本体。</p>
            </div>
            <a
              href={`/reports/files/${report.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/72 hover:bg-white/10 hover:text-white"
            >
              <Iconify icon="solar:external-link-linear" width="17" />
              打开文件
            </a>
          </div>
          <pre className="max-h-[68vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/75">{preview}</pre>
        </section>
      </TemplatePageWrap>
      <DividerPulse />
    </>
  );
}

function Meta({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-[0.16em] text-white/38">{label}</div>
      <div className="mt-2 break-all text-sm text-white/80">{value}</div>
    </div>
  );
}

function readReportPreview(absPath: string, format: string) {
  if (!fs.existsSync(absPath)) return "报告文件不存在。";
  const raw = fs.readFileSync(absPath, "utf-8");
  if (format === "json") {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  return raw;
}

async function getReportRecord(id: string) {
  const records = await listReportRecords(1000);
  return records.find((record) => record.id === id) ?? null;
}
