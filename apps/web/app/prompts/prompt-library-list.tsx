"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui";
import { TemplateListItem } from "@/components/template/sections";
import { formatDate } from "@/lib/utils";

type PromptListItem = {
  id: string;
  name: string;
  status: string;
  tags: string[];
  versionCount: number;
  updatedAt: string;
};

export function PromptLibraryList({ prompts }: { prompts: PromptListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const statuses = useMemo(() => Array.from(new Set(prompts.map((prompt) => prompt.status))).sort(), [prompts]);
  const filtered = prompts.filter((prompt) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [prompt.name, prompt.status, prompt.tags.join(" ")].join(" ").toLowerCase().includes(q);
    const matchesStatus = status === "all" || prompt.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <div className="grid gap-3 border-b border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1fr_220px]">
        <Input placeholder="搜索 Prompt、标签或状态" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部状态</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      {filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-white/40">没有匹配的 Prompt</p>
      ) : (
        filtered.map((p, i) => (
          <TemplateListItem
            key={p.id}
            href={`/prompts/${p.id}`}
            index={i}
            icon="solar:document-text-linear"
            name={p.name}
            sub={p.status}
            specs={[
              { label: "版本", value: String(p.versionCount) },
              { label: "标签", value: p.tags.join(", ") || "-" },
              { label: "更新", value: formatDate(p.updatedAt) },
            ]}
            tier={p.status}
          />
        ))
      )}
    </>
  );
}
