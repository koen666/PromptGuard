import Link from "next/link";
import { getDatasetPage } from "@promptguard/core";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { loadEnv } from "@/lib/env";
import { Panel, TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";

loadEnv();

export default async function DatasetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const dataset = await getDatasetPage(id, Number(page ?? 1), 20);
  if (!dataset) notFound();

  return (
    <TemplatePageWrap>
      <TemplateSectionHeader tag="数据集" title={dataset.name} titleMuted="预览" />
      <Panel>
        <div className="mb-4 grid gap-3 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-white/40">描述</div>
            <div className="mt-1 text-white/80">{dataset.description || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">用例总数</div>
            <div className="mt-1 text-white/80">{dataset.total}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">更新</div>
            <div className="mt-1 text-white/80">{formatDate(dataset.updatedAt)}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">ID</div>
            <div className="mt-1 break-all font-mono text-white/70">{dataset.id}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-white/10">
          <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/40">
            <span className="col-span-1">#</span>
            <span className="col-span-5">输入</span>
            <span className="col-span-4">预期表现</span>
            <span className="col-span-2">标签</span>
          </div>
          {dataset.testCases.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 border-b border-white/8 px-3 py-3 text-sm last:border-b-0">
              <span className="col-span-1 font-mono text-white/35">{(dataset.page - 1) * dataset.pageSize + index + 1}</span>
              <span className="col-span-5 whitespace-pre-wrap text-white/85">{item.input}</span>
              <span className="col-span-4 whitespace-pre-wrap text-white/60">{item.expectedBehavior || "-"}</span>
              <span className="col-span-2 break-all text-white/40">{item.tags || "-"}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/datasets" className="text-sm text-white/50 hover:text-white">
            返回数据集
          </Link>
          <div className="flex items-center justify-end gap-3">
            <span className="text-sm text-white/45">
              {dataset.page}/{dataset.totalPages}
            </span>
            <PageLink disabled={dataset.page <= 1} href={`/datasets/${dataset.id}?page=${dataset.page - 1}`}>
              上一页
            </PageLink>
            <PageLink disabled={dataset.page >= dataset.totalPages} href={`/datasets/${dataset.id}?page=${dataset.page + 1}`}>
              下一页
            </PageLink>
          </div>
        </div>
      </Panel>
    </TemplatePageWrap>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const className = "inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10";
  if (disabled) {
    return <span className={`${className} cursor-not-allowed opacity-50`}>{children}</span>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
