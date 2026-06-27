import { getSecurityScan, listPrompts, listSecurityScans } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import {
  TemplateListItem,
  TemplateListSection,
} from "@/components/template/sections";
import { SecurityRunForm } from "./run-form";

loadEnv();

export default async function SecurityPage() {
  const [scans, prompts] = await Promise.all([listSecurityScans(), listPrompts()]);
  const scanDetails = await Promise.all(scans.slice(0, 80).map((scan) => getSecurityScan(scan.id)));
  const findings = scanDetails.flatMap((scan) => scan?.findings ?? []);
  const failedFindings = findings.filter((finding) => !finding.passed);
  const criticalFindings = findings.filter((finding) => finding.riskLevel === "critical" || finding.riskLevel === "high");

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="安全" title="安全扫描" titleMuted="风险检测" />
        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <SecurityStat label="扫描总数" value={scans.length} />
          <SecurityStat label="未通过扫描" value={scans.filter((scan) => scan.passed === false).length} />
          <SecurityStat label="高危发现" value={criticalFindings.length} />
          <SecurityStat label="拦截攻击" value={failedFindings.length} helper="未通过 finding" />
        </section>
        <div>
          <h3 className="text-lg font-semibold text-white">运行安全扫描</h3>
          <p className="mt-1 text-sm text-white/45">选择提示词版本后执行诱导泄露测试。</p>
          <SecurityRunForm prompts={prompts} />
        </div>
      </TemplatePageWrap>
      <TemplateListSection title="安全扫描" description="诱导测试与提示词泄露风险检测。">
        {scans.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有扫描记录</p>
        ) : (
          scans.map((s, i) => (
            <TemplateListItem
              key={s.id}
              href={`/security/${s.id}`}
              index={i}
              icon="solar:shield-check-linear"
              name={s.id.slice(0, 16) + "…"}
              sub={s.passed ? "通过" : "未通过"}
              specs={[
                { label: "风险", value: s.riskScore?.toFixed(1) ?? "—" },
                { label: "提供商", value: s.provider },
                { label: "时间", value: formatDate(s.createdAt) },
              ]}
              tier={s.passed ? "Pass" : "Fail"}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}

function SecurityStat({ label, value, helper }: { label: string; value: React.ReactNode; helper?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {helper && <div className="mt-1 text-xs text-white/38">{helper}</div>}
    </div>
  );
}
