"use client";

import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

type Provider = "mock" | "openai" | "anthropic" | "ollama";
type OpenAiWireApi = "responses" | "chat_completions";
type AlertOperator = ">" | ">=" | "<" | "<=";
type AlertSeverity = "low" | "medium" | "high";

interface AlertRuleForm {
  metric: string;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

interface SettingsState {
  provider: Provider;
  databasePath: string;
  openaiBaseUrl: string;
  openaiWireApi: OpenAiWireApi;
  openaiModel: string;
  openaiReviewModel: string;
  openaiReasoningEffort: string;
  openaiDisableResponseStorage: boolean;
  anthropicModel: string;
  ollamaModel: string;
  ollamaBaseUrl: string;
  hasOpenAiKey: boolean;
  hasAnthropicKey: boolean;
  alerts: AlertRuleForm[];
}

export function SettingsForm({ initialSettings }: { initialSettings: SettingsState }) {
  const [provider, setProvider] = useState<Provider>(initialSettings.provider);
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(initialSettings.openaiBaseUrl);
  const [openaiWireApi, setOpenaiWireApi] = useState<OpenAiWireApi>(initialSettings.openaiWireApi);
  const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel);
  const [openaiReviewModel, setOpenaiReviewModel] = useState(initialSettings.openaiReviewModel);
  const [openaiReasoningEffort, setOpenaiReasoningEffort] = useState(initialSettings.openaiReasoningEffort);
  const [openaiDisableResponseStorage, setOpenaiDisableResponseStorage] = useState(initialSettings.openaiDisableResponseStorage);
  const [anthropicModel, setAnthropicModel] = useState(initialSettings.anthropicModel);
  const [ollamaModel, setOllamaModel] = useState(initialSettings.ollamaModel);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(initialSettings.ollamaBaseUrl);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [hasOpenAiKey, setHasOpenAiKey] = useState(initialSettings.hasOpenAiKey);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(initialSettings.hasAnthropicKey);
  const [alerts, setAlerts] = useState<AlertRuleForm[]>(initialSettings.alerts);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateAlert(index: number, patch: Partial<AlertRuleForm>) {
    setAlerts((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  function addAlert() {
    setAlerts((current) => [
      ...current,
      { metric: "latency_ms", operator: ">", threshold: 1000, severity: "medium", enabled: true },
    ]);
  }

  function removeAlert(index: number) {
    setAlerts((current) => current.filter((_, i) => i !== index));
  }

  async function saveSettings(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          openaiBaseUrl,
          openaiWireApi,
          openaiModel,
          openaiReviewModel,
          openaiReasoningEffort,
          openaiDisableResponseStorage,
          anthropicModel,
          ollamaModel,
          ollamaBaseUrl,
          openaiApiKey: openaiApiKey.trim() || undefined,
          anthropicApiKey: anthropicApiKey.trim() || undefined,
          alertRules: alerts,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "保存失败");
      setHasOpenAiKey(data.hasOpenAiKey ?? hasOpenAiKey);
      setHasAnthropicKey(data.hasAnthropicKey ?? hasAnthropicKey);
      setOpenaiApiKey("");
      setAnthropicApiKey("");
      setMessage("配置已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-5 lg:grid-cols-2" onSubmit={saveSettings}>
      <Panel>
        <h3 className="text-lg font-semibold text-white">LLM 提供商</h3>
        <div className="mt-4 grid gap-4">
          <div>
            <FieldLabel>Provider</FieldLabel>
            <Select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              <option value="mock">mock</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="ollama">ollama 本地模型</option>
            </Select>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
            <FieldLabel>Ollama 本地模型</FieldLabel>
            <Input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} placeholder="qwen2.5:7b" />
            <p className="mt-1 text-xs text-white/40">例如 qwen2.5:7b、llama3.2:latest。选择 ollama 后，评测和安全扫描会请求本机 Ollama。</p>
          </div>
          <div>
            <FieldLabel>Ollama 地址</FieldLabel>
            <Input value={ollamaBaseUrl} onChange={(e) => setOllamaBaseUrl(e.target.value)} placeholder="http://127.0.0.1:11434" />
          </div>
          <div>
            <FieldLabel>OpenAI Base URL</FieldLabel>
            <Input value={openaiBaseUrl} onChange={(e) => setOpenaiBaseUrl(e.target.value)} placeholder="https://api.openai.com" />
          </div>
          <div>
            <FieldLabel>OpenAI Wire API</FieldLabel>
            <Select value={openaiWireApi} onChange={(e) => setOpenaiWireApi(e.target.value as OpenAiWireApi)}>
              <option value="responses">responses</option>
              <option value="chat_completions">chat_completions</option>
            </Select>
          </div>
          <div>
            <FieldLabel>OpenAI 模型</FieldLabel>
            <Input value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} placeholder="gpt-5.5" />
            <p className="mt-1 text-xs text-white/40">OpenAI Key：{hasOpenAiKey ? "已配置" : "未配置"}</p>
          </div>
          <div>
            <FieldLabel>OpenAI Review 模型</FieldLabel>
            <Input value={openaiReviewModel} onChange={(e) => setOpenaiReviewModel(e.target.value)} placeholder="gpt-5.5" />
          </div>
          <div>
            <FieldLabel>Reasoning Effort</FieldLabel>
            <Input value={openaiReasoningEffort} onChange={(e) => setOpenaiReasoningEffort(e.target.value)} placeholder="xhigh" />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#d6c985]"
              checked={openaiDisableResponseStorage}
              onChange={(e) => setOpenaiDisableResponseStorage(e.target.checked)}
            />
            禁用 Responses 存储 store=false
          </label>
          <div>
            <FieldLabel>OpenAI API Key</FieldLabel>
            <Input
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder={hasOpenAiKey ? "留空则保留当前 Key" : "sk-..."}
              autoComplete="off"
            />
          </div>
          <div>
            <FieldLabel>Anthropic 模型</FieldLabel>
            <Input value={anthropicModel} onChange={(e) => setAnthropicModel(e.target.value)} placeholder="claude-3-5-haiku-20241022" />
            <p className="mt-1 text-xs text-white/40">Anthropic Key：{hasAnthropicKey ? "已配置" : "未配置"}</p>
          </div>
          <div>
            <FieldLabel>Anthropic API Key</FieldLabel>
            <Input
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder={hasAnthropicKey ? "留空则保留当前 Key" : "sk-ant-..."}
              autoComplete="off"
            />
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
            数据库路径：<span className="break-all font-mono text-white/70">{initialSettings.databasePath}</span>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">告警阈值</h3>
            <p className="mt-1 text-sm text-white/45">用于发布观察、评测和安全扫描的阈值规则。</p>
          </div>
          <Button variant="secondary" onClick={addAlert} type="button">
            添加
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {alerts.map((rule, index) => (
            <div key={`${rule.metric}-${index}`} className="grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 md:grid-cols-12">
              <Input
                className="md:col-span-3"
                value={rule.metric}
                onChange={(e) => updateAlert(index, { metric: e.target.value })}
                placeholder="latency_ms"
              />
              <Select
                className="md:col-span-2"
                value={rule.operator}
                onChange={(e) => updateAlert(index, { operator: e.target.value as AlertOperator })}
              >
                <option value=">">&gt;</option>
                <option value=">=">&gt;=</option>
                <option value="<">&lt;</option>
                <option value="<=">&lt;=</option>
              </Select>
              <Input
                className="md:col-span-2"
                type="number"
                value={rule.threshold}
                onChange={(e) => updateAlert(index, { threshold: Number(e.target.value) })}
              />
              <Select
                className="md:col-span-2"
                value={rule.severity}
                onChange={(e) => updateAlert(index, { severity: e.target.value as AlertSeverity })}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </Select>
              <label className="flex items-center gap-2 text-sm text-white/70 md:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-400"
                  checked={rule.enabled}
                  onChange={(e) => updateAlert(index, { enabled: e.target.checked })}
                />
                启用
              </label>
              <Button className="px-2 md:col-span-1" variant="ghost" type="button" onClick={() => removeAlert(index)}>
                删除
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {message && <span className="text-emerald-300">{message}</span>}
            {error && <span className="text-red-300">{error}</span>}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "保存中" : "保存配置"}
          </Button>
        </div>
      </Panel>
    </form>
  );
}
