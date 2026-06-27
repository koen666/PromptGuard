import Link from "next/link";
import { notFound } from "next/navigation";
import { getSecurityScan } from "@promptguard/core";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { OptimizerActions } from "./optimizer-actions";

loadEnv();

export default async function SecurityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getSecurityScan(id);
  if (!scan) notFound();
  const optimization = scan.latestOptimization;
  const review = optimization?.review;

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

        <Panel className="mt-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-white">GPT 结构化评审与 Prompt 优化</h3>
                {review && <StatusPill value={review.source === "model" ? "Review Model" : "Fallback Draft"} />}
                {optimization?.status === "applied" && <StatusPill value="Applied" />}
              </div>
              <p className="mt-1 max-w-3xl text-sm text-white/45">
                根据安全 finding 分析可逆向路径、泄露概率和修复方案，生成可审阅的新 Prompt 草案。
              </p>
            </div>
            <OptimizerActions
              scanId={scan.id}
              optimizationId={optimization?.id}
              applied={optimization?.status === "applied"}
            />
          </div>

          {!review ? (
            <p className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
              还没有优化草案。点击生成后会调用 review model 输出结构化 JSON 和新版 Prompt。
            </p>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/40">综合风险</div>
                    <div className="mt-2 text-xl font-semibold text-white">{review.overallRiskLevel}</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/40">风险分</div>
                    <div className="mt-2 text-xl font-semibold text-white">{review.overallRiskScore.toFixed(2)}</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/40">泄露概率</div>
                    <div className="mt-2 text-xl font-semibold text-white">{Math.round(review.leakProbability * 100)}%</div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">{review.summary}</p>
                <div className="mt-4 space-y-2">
                  {review.hardeningPlan.slice(0, 5).map((item) => (
                    <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/65">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 xl:col-span-8">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <h4 className="text-sm font-semibold text-white">可逆向风险路径</h4>
                  <div className="mt-3 space-y-3">
                    {review.risks.slice(0, 4).map((risk) => (
                      <div key={`${risk.title}-${risk.severity}`} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">{risk.title}</span>
                          <StatusPill value={risk.severity} />
                          <span className="text-xs text-white/40">{Math.round(risk.leakProbability * 100)}%</span>
                        </div>
                        <p className="mt-2 text-sm text-white/55">{risk.reverseEngineeringPath}</p>
                        <p className="mt-1 text-sm text-[#d6c985]">{risk.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-white/10 bg-[#0f1111]/80 p-4">
                  <h4 className="text-sm font-semibold text-white">优化后 Prompt 草案</h4>
                  <pre className="mt-3 max-h-[460px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/70">
                    {review.optimizedPrompt}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Panel>
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
