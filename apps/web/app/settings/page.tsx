import { getSystemSettings } from "@promptguard/core";
import { loadEnv } from "@/lib/env";
import { StatusPill, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { SettingsForm } from "./settings-form";

loadEnv();

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  return (
    <TemplatePageWrap>
      <TemplateSectionHeader tag="配置" title="系统设置" titleMuted="配置" action={<StatusPill value={settings.provider} />} />
      <SettingsForm initialSettings={settings} />
    </TemplatePageWrap>
  );
}
