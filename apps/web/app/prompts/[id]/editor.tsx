"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

export function PromptEditor({ promptId, initialContent }: { promptId: string; initialContent: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await fetch(`/api/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, changelog: changelog || undefined }),
      });
      router.refresh();
      setChangelog("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">编辑提示词</h2>
          <p className="mt-1 text-sm text-white/45">保存会生成新的不可变版本快照。</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45">
          草稿
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel>正文</FieldLabel>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="font-mono text-xs leading-6" />
      </div>
      <div className="mt-3">
        <FieldLabel>变更说明</FieldLabel>
        <Input placeholder="例如：补充拒答边界和输出格式要求" value={changelog} onChange={(e) => setChangelog(e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "保存中…" : "保存新版本"}
        </Button>
      </div>
    </Panel>
  );
}
