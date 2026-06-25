import { listAlertRecords, listGrayReleases, listMetricSamples, listPrompts, listReleaseHistory, listRoutePolicies } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { Panel, StatusPill, TemplateListItem, TemplateListSection, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { NewReleaseForm, ReleaseActions } from "./actions";

loadEnv();

export default async function ReleasesPage() {
  const [releases, policies, samples, alerts, history, prompts] = await Promise.all([
    listGrayReleases(),
    listRoutePolicies(),
    listMetricSamples(),
    listAlertRecords("open"),
    listReleaseHistory(),
    listPrompts(),
  ]);
  const active = releases.find((r) => r.status === "active");
  const activePolicy = policies.find((policy) => policy.status === "gray");
  const activeSamples = active ? samples.filter((sample) => sample.releaseId === active.id) : samples.slice(0, 20);
  const scoreSamples = activeSamples.filter((sample) => sample.metric === "observation_score").slice(0, 8).reverse();
  const latencySamples = activeSamples.filter((sample) => sample.metric === "latency_ms").slice(0, 8).reverse();

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Deploy" title="Gray Release" titleMuted="回滚" />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel>
            <h3 className="text-lg font-semibold text-white">发布策略</h3>
            <p className="mt-2 text-sm text-white/45">当前页面展示路由策略、落表指标样本、阈值告警和发布历史。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">活跃发布</div>
                <div className="mt-2 text-xl font-semibold text-white">{activePolicy ? `${activePolicy.trafficPercent}%` : "无"}</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">观察分</div>
                <div className="mt-2 text-xl font-semibold text-white">{active?.observationScore?.toFixed(2) ?? "-"}</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">状态</div>
                <div className="mt-2"><StatusPill value={activePolicy?.status ?? active?.status ?? "idle"} /></div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TrendPanel title="观察分趋势" samples={scoreSamples} max={1} suffix="" />
              <TrendPanel title="延迟趋势" samples={latencySamples} max={900} suffix="ms" />
            </div>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold text-white">当前告警</h3>
            <div className="mt-3 space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-white/45">暂无开放告警</p>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="rounded-md border border-red-400/20 bg-red-500/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-red-100">{alert.metric}</span>
                      <StatusPill value={alert.severity} />
                    </div>
                    <p className="mt-1 text-xs text-red-100/70">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <NewReleaseForm prompts={prompts} />
          {active ? (
            <ReleaseActions promptId={active.promptId} currentTrafficPercent={active.trafficPercent} />
          ) : (
            <Panel>
              <h3 className="text-lg font-semibold text-white">活跃灰度操作</h3>
              <p className="mt-1 text-sm text-white/45">暂无活跃灰度。创建灰度后可在这里扩容、全量发布或回滚。</p>
            </Panel>
          )}
        </div>
      </TemplatePageWrap>

      <TemplateListSection title="路由策略" description="当前生效版本、灰度版本、环境和流量比例。">
        {policies.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有路由策略</p>
        ) : (
          policies.map((policy, i) => (
            <TemplateListItem
              key={policy.id}
              index={i}
              icon="solar:route-linear"
              name={`${policy.environment} · ${policy.trafficPercent}% 灰度`}
              sub={policy.status}
              specs={[
                { label: "Prompt", value: policy.promptId.slice(0, 12) + "…" },
                { label: "Stable", value: policy.stableVersionId?.slice(0, 12) + "…" || "—" },
                { label: "Gray", value: policy.grayVersionId?.slice(0, 12) + "…" || "—" },
                { label: "更新", value: formatDate(policy.updatedAt) },
              ]}
              tier={policy.status}
            />
          ))
        )}
      </TemplateListSection>

      <TemplateListSection title="灰度发布" description="控制流量比例，观察指标并支持回滚。">
        {releases.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有发布记录</p>
        ) : (
          releases.map((r, i) => (
            <div key={r.id} className="grid border-b border-white/10 last:border-b-0 md:grid-cols-[1fr_auto]">
              <TemplateListItem
                index={i}
                icon="solar:rocket-2-linear"
                name={`${r.trafficPercent}% 灰度`}
                sub={r.status}
                specs={[
                  { label: "Prompt", value: r.promptId.slice(0, 12) + "…" },
                  { label: "观察分", value: r.observationScore?.toFixed(2) ?? "—" },
                  { label: "时间", value: formatDate(r.createdAt) },
                ]}
                tier={r.status}
              />
              {r.status === "active" && (
                <div className="flex items-center justify-start px-4 pb-4 md:justify-end md:pb-0">
                  <ReleaseActions promptId={r.promptId} currentTrafficPercent={r.trafficPercent} compact />
                </div>
              )}
            </div>
          ))
        )}
      </TemplateListSection>

      <TemplateListSection title="发布历史" description="灰度开始、扩容、全量和回滚事件。">
        {history.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">暂无发布事件</p>
        ) : (
          history.slice(0, 20).map((event, i) => (
            <TemplateListItem
              key={event.id}
              index={i}
              icon="solar:clock-circle-linear"
              name={event.eventType}
              sub={event.detail || "—"}
              specs={[
                { label: "Prompt", value: event.promptId.slice(0, 12) + "…" },
                { label: "Version", value: event.promptVersionId?.slice(0, 12) + "…" || "—" },
                { label: "时间", value: formatDate(event.createdAt) },
              ]}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}

function TrendPanel({
  title,
  samples,
  max,
  suffix,
}: {
  title: string;
  samples: Array<{ id: string; value: number; unit?: string | null; sampledAt: string }>;
  max: number;
  suffix: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{title}</span>
        <span className="text-xs text-white/55">{samples.at(-1)?.value.toFixed(suffix ? 0 : 2) ?? "-"}{suffix}</span>
      </div>
      <div className="mt-3 flex h-20 items-end gap-2">
        {samples.length === 0 ? (
          <div className="text-sm text-white/35">暂无样本</div>
        ) : (
          samples.map((sample) => (
            <div key={sample.id} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-sm bg-emerald-300/70"
                style={{ height: `${Math.max(8, Math.min(100, (sample.value / max) * 100))}%` }}
                title={`${sample.value}${suffix} · ${sample.sampledAt}`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
