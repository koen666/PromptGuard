"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { FieldLabel, Panel } from "@/components/template/sections";

export function CreatePromptForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  async function handleCreate() {
    setLoading(true);
    try {
      const prompt = await apiPost<{ id: string }>("/api/prompts", {
        name,
        description,
        content,
        tagNames: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setName("");
      setDescription("");
      setContent("");
      setTags("");
      router.push(`/prompts/${prompt.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">新建提示词</h3>
          <p className="mt-1 text-sm text-white/45">录入名称、正文和标签后自动生成 v1 快照。</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45">
          正文建议控制在 32KB 内
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>名称</FieldLabel>
          <Input placeholder="例如：客服助手" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <FieldLabel>业务场景</FieldLabel>
          <Input placeholder="这个提示词的使用场景" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>标签</FieldLabel>
          <Input placeholder="客服, 生产" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>系统提示词内容</FieldLabel>
          <Textarea
            placeholder="在这里写入系统提示词内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <p className="text-xs text-white/35">创建后可在详情页保存新版本、提交审核、运行安全扫描。</p>
          <Button onClick={handleCreate} disabled={loading || !name || !content}>
            {loading ? "创建中…" : "创建"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
