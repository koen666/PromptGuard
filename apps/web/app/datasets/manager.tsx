"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

type ImportFormat = "json" | "csv";

interface ImportErrorItem {
  row: number;
  field: string;
  message: string;
}

interface PreviewCase {
  input: string;
  expectedBehavior?: string;
  tags?: string;
}

export function DatasetManager() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<ImportFormat>("json");
  const [content, setContent] = useState('[{"input":"你好","expectedBehavior":"友好回复","tags":"smoke"}]');
  const [preview, setPreview] = useState<PreviewCase[]>([]);
  const [errors, setErrors] = useState<ImportErrorItem[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [loading, setLoading] = useState(false);

  function switchFormat(nextFormat: ImportFormat) {
    setFormat(nextFormat);
    setErrors([]);
    setPreview([]);
    setPreviewPage(1);
    setContent(
      nextFormat === "csv"
        ? "input,expectedBehavior,tags\n你好,友好回复,smoke\n请用英文介绍产品,用英文回答,language"
        : '[{"input":"你好","expectedBehavior":"友好回复","tags":"smoke"}]',
    );
  }

  async function handlePreview() {
    setLoading(true);
    setErrors([]);
    try {
      const response = await fetch("/api/datasets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, format, content }),
      });
      const data = await response.json();
      setPreview(data.preview ?? []);
      setErrors(data.errors ?? []);
      setPreviewPage(1);
    } catch (error) {
      setErrors([{ row: 0, field: "network", message: error instanceof Error ? error.message : "预览失败" }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setErrors([]);
    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, format, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors ?? [{ row: 0, field: "import", message: data.error ?? "导入失败" }]);
        return;
      }
      setName("");
      setDescription("");
      setErrors([]);
      setPreview([]);
      router.refresh();
    } catch (error) {
      setErrors([{ row: 0, field: "network", message: error instanceof Error ? error.message : "导入失败" }]);
    } finally {
      setLoading(false);
    }
  }

  const previewPageSize = 5;
  const previewTotalPages = Math.max(1, Math.ceil(preview.length / previewPageSize));
  const pagePreview = preview.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize);

  return (
    <Panel>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">新建数据集</h3>
          <p className="mt-1 text-sm text-white/45">支持 JSON / CSV 导入，最多 500 条，单次不超过 10MB。</p>
        </div>
        <Select className="w-full md:w-36" value={format} onChange={(e) => switchFormat(e.target.value as ImportFormat)}>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </Select>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>名称</FieldLabel>
          <Input placeholder="客服基础测试集" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>描述</FieldLabel>
          <Input placeholder="常见客服问答场景" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>测试样例内容</FieldLabel>
          <Textarea
            placeholder={format === "csv" ? "input,expectedBehavior,tags" : "用例 JSON"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={9}
            className="font-mono text-xs md:col-span-2"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-md border border-red-400/20 bg-red-500/10">
          <div className="border-b border-red-400/15 px-3 py-2 text-sm font-medium text-red-200">导入错误</div>
          <div className="max-h-44 overflow-auto">
            {errors.map((err, index) => (
              <div key={`${err.row}-${err.field}-${index}`} className="grid grid-cols-12 gap-2 border-b border-red-400/10 px-3 py-2 text-xs last:border-b-0">
                <span className="col-span-2 font-mono text-red-100">{err.row || "-"}</span>
                <span className="col-span-3 text-red-100">{err.field}</span>
                <span className="col-span-7 text-red-200/85">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-sm font-medium text-white">预览</span>
            <span className="text-xs text-white/45">
              {previewPage}/{previewTotalPages}
            </span>
          </div>
          {pagePreview.map((item, index) => (
            <div key={`${item.input}-${index}`} className="grid gap-2 border-b border-white/8 px-3 py-2 text-xs last:border-b-0 md:grid-cols-12">
              <span className="truncate text-white md:col-span-5">{item.input}</span>
              <span className="truncate text-white/60 md:col-span-5">{item.expectedBehavior || "-"}</span>
              <span className="truncate text-white/40 md:col-span-2">{item.tags || "-"}</span>
            </div>
          ))}
          <div className="flex justify-end gap-2 border-t border-white/10 px-3 py-2">
            <Button variant="ghost" disabled={previewPage <= 1} onClick={() => setPreviewPage((page) => page - 1)}>
              上一页
            </Button>
            <Button variant="ghost" disabled={previewPage >= previewTotalPages} onClick={() => setPreviewPage((page) => page + 1)}>
              下一页
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/35">CSV 表头需要包含 input，可选 expectedBehavior、tags。</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handlePreview} disabled={loading || !content}>
            预览
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name || !content}>
          创建
          </Button>
        </div>
      </div>
    </Panel>
  );
}
