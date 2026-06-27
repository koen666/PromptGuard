import { listPrompts, listSecurityScans } from "@promptguard/core";
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

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="安全" title="安全扫描" titleMuted="风险检测" />
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
