import { listPrompts } from "@promptguard/core";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import {
  TemplateListItem,
  TemplateListSection,
  TemplatePageWrap,
  TemplateSectionHeader,
} from "@/components/template/sections";
import { CreatePromptForm } from "./create-form";

loadEnv();

export default async function PromptsPage() {
  const prompts = await listPrompts();

  return (
    <>
      <TemplatePageWrap>
        <TemplateSectionHeader
          tag="资产"
          title="提示词"
          titleMuted="资产"
        />
        <CreatePromptForm />
      </TemplatePageWrap>

      <TemplateListSection vol={`${prompts.length} 个`} title="提示词资产" description="管理提示词版本与标签。">
        {prompts.length === 0 ? (
          <p className="px-4 py-6 text-center text-white/40">还没有提示词</p>
        ) : (
          prompts.map((p, i) => (
            <TemplateListItem
              key={p.id}
              href={`/prompts/${p.id}`}
              index={i}
              icon="solar:document-text-linear"
              name={p.name}
              sub={p.status}
              specs={[
                { label: "版本", value: String(p.versionCount) },
                { label: "标签", value: p.tags.join(", ") || "—" },
                { label: "更新", value: formatDate(p.updatedAt) },
              ]}
              tier={p.status}
            />
          ))
        )}
      </TemplateListSection>
    </>
  );
}
