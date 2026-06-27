"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthStatus } from "@/components/auth-status";
import { NAV_LINKS } from "./constants";
import { Iconify } from "./iconify";
import { getStatusLabel } from "./sections";

const SEARCH_ALIASES: Record<string, string[]> = {
  "/": ["overview", "home", "dashboard", "workspace", "总览", "首页"],
  "/prompts": ["prompt", "prompts", "asset", "assets", "library", "资产", "资产库", "提示词"],
  "/project": ["project", "remote", "push", "pull", "sync", "项目", "远程", "同步"],
  "/datasets": ["dataset", "datasets", "data", "case", "cases", "数据", "数据集", "用例"],
  "/evaluations": ["evaluation", "evaluations", "eval", "score", "test", "评测", "测试"],
  "/security": ["security", "scan", "shield", "guard", "安全", "扫描", "防护"],
  "/reviews": ["review", "reviews", "approval", "approve", "审核", "审批"],
  "/releases": ["release", "releases", "gray", "canary", "rollback", "发布", "灰度", "回滚"],
  "/reports": ["report", "reports", "export", "报告", "导出"],
  "/audit": ["audit", "logs", "history", "审计", "日志"],
  "/settings": ["setting", "settings", "config", "configuration", "设置", "配置"],
};

const SEARCH_DESCRIPTIONS: Record<string, string> = {
  "/": "工作台概览",
  "/prompts": "提示词资产库",
  "/project": "项目 remote 与同步状态",
  "/datasets": "数据集与测试用例",
  "/evaluations": "评测任务",
  "/security": "安全扫描",
  "/reviews": "审核队列",
  "/releases": "灰度发布",
  "/reports": "已生成报告",
  "/audit": "审计日志",
  "/settings": "系统设置",
};

type HeaderPanel = "notifications" | "export" | null;

type NotificationState = {
  loading: boolean;
  pendingReviews: number;
  activeGrayReleases: number;
  totalPrompts: number;
  completedEvaluations: number;
  openAlerts: number;
  latestRunStatus?: string;
};

type ExportOption = {
  label: string;
  description: string;
  endpoint: string;
  filePrefix: string;
};

const EXPORT_OPTIONS: ExportOption[] = [
  { label: "总览摘要", description: "当前工作台指标", endpoint: "/api/dashboard", filePrefix: "dashboard" },
  { label: "提示词资产", description: "提示词列表与版本摘要", endpoint: "/api/prompts", filePrefix: "prompts" },
  { label: "项目状态", description: "remote 与 prompt 同步状态", endpoint: "/api/project", filePrefix: "project" },
  { label: "数据集", description: "数据集目录", endpoint: "/api/datasets", filePrefix: "datasets" },
  { label: "评测任务", description: "评测历史记录", endpoint: "/api/evaluations", filePrefix: "evaluations" },
  { label: "安全扫描", description: "安全扫描记录", endpoint: "/api/security", filePrefix: "security" },
  { label: "审核队列", description: "审核流程记录", endpoint: "/api/reviews", filePrefix: "reviews" },
  { label: "发布状态", description: "灰度发布状态与告警", endpoint: "/api/releases", filePrefix: "releases" },
  { label: "报告索引", description: "报告记录与来源", endpoint: "/api/reports", filePrefix: "reports" },
  { label: "审计日志", description: "近期审计事件", endpoint: "/api/audit", filePrefix: "audit" },
  { label: "系统设置", description: "模型提供商与告警配置", endpoint: "/api/settings", filePrefix: "settings" },
];

function currentExportOption(pathname: string) {
  if (pathname.startsWith("/prompts")) return EXPORT_OPTIONS[1];
  if (pathname.startsWith("/project")) return EXPORT_OPTIONS[2];
  if (pathname.startsWith("/datasets")) return EXPORT_OPTIONS[3];
  if (pathname.startsWith("/evaluations")) return EXPORT_OPTIONS[4];
  if (pathname.startsWith("/security")) return EXPORT_OPTIONS[5];
  if (pathname.startsWith("/reviews")) return EXPORT_OPTIONS[6];
  if (pathname.startsWith("/releases")) return EXPORT_OPTIONS[7];
  if (pathname.startsWith("/reports")) return EXPORT_OPTIONS[8];
  if (pathname.startsWith("/audit")) return EXPORT_OPTIONS[9];
  if (pathname.startsWith("/settings")) return EXPORT_OPTIONS[10];
  return EXPORT_OPTIONS[0];
}

function downloadJson(filePrefix: string, data: unknown) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `promptguard-${filePrefix}-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function fetchJson(endpoint: string) {
  const response = await fetch(endpoint, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? `导出失败：${endpoint}`);
  }
  return data;
}

function NavSearch({
  variant,
  placeholder,
}: {
  variant: "top" | "side";
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const entries = NAV_LINKS.map((link) => ({
      ...link,
      description: SEARCH_DESCRIPTIONS[link.href] ?? "打开页面",
      haystack: [link.label, link.href, ...(SEARCH_ALIASES[link.href] ?? [])].join(" ").toLowerCase(),
      exactMatch: link.label.toLowerCase() === normalized || (SEARCH_ALIASES[link.href] ?? []).some((alias) => alias.toLowerCase() === normalized),
    }));
    const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

    if (!normalized) {
      return entries
        .filter((link, index, list) => list.findIndex((item) => item.href === link.href) === index)
        .sort((a, b) => Number(isActive(b.href)) - Number(isActive(a.href)))
        .slice(0, 5);
    }

    return entries
      .filter((link) => link.haystack.includes(normalized))
      .sort((a, b) => Number(b.exactMatch) - Number(a.exactMatch))
      .slice(0, 6);
  }, [pathname, query]);

  function navigateTo(href: string, label: string) {
    setQuery(label);
    setOpen(false);
    router.push(href);
  }

  const chromeClass =
    variant === "top"
      ? "hidden min-w-[280px] max-w-md flex-1 lg:block"
      : "mb-5";
  const inputWrapClass =
    variant === "top"
      ? "flex h-10 items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111217]/78 px-4 text-sm text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-[#7067ff]/45"
      : "flex h-12 items-center gap-2 rounded-[18px] border border-white/[0.07] bg-[#14151a]/88 px-3 text-sm text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition focus-within:border-[#7067ff]/45";
  const dropdownClass =
    variant === "top"
      ? "absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#181920]/96 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
      : "absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#181920]/96 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl";

  return (
    <form
      className={`relative ${chromeClass}`}
      onSubmit={(event) => {
        event.preventDefault();
        const first = results[0];
        if (first) navigateTo(first.href, first.label);
      }}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setOpen(false);
        }
      }}
    >
      <div className={inputWrapClass}>
        <Iconify icon="solar:magnifer-linear" width="18" />
        <input
          aria-label="搜索工作台"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/38"
          placeholder={placeholder}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const first = results[0];
              if (first) navigateTo(first.href, first.label);
            }
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            }
          }}
        />
        {query ? (
          <button
            aria-label="清空搜索"
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/42 transition hover:bg-white/[0.08] hover:text-white"
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
          >
            <Iconify icon="solar:close-circle-linear" width="16" />
          </button>
        ) : (
          <Iconify
            className={variant === "top" ? "text-white/38" : "text-[#ffe36e]"}
            icon={variant === "top" ? "solar:microphone-2-linear" : "solar:star-bold"}
            width={variant === "top" ? "17" : "15"}
          />
        )}
      </div>

      {open && (
        <div className={dropdownClass}>
          {results.length ? (
            results.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <button
                  key={link.href}
                  className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
                    active ? "bg-[#7067ff]/90 text-white" : "text-white/64 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  type="button"
                  onClick={() => navigateTo(link.href, link.label)}
                >
                  <Iconify icon={link.icon} width="18" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{link.label}</span>
                    <span className="block truncate text-xs opacity-55">{link.description}</span>
                  </span>
                  <Iconify icon="solar:alt-arrow-right-linear" width="15" />
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-sm text-white/42">没有匹配页面</div>
          )}
        </div>
      )}
    </form>
  );
}

function HeaderActions({ activeLabel }: { activeLabel: string }) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<HeaderPanel>(null);
  const [notice, setNotice] = useState<NotificationState>({
    loading: true,
    pendingReviews: 0,
    activeGrayReleases: 0,
    totalPrompts: 0,
    completedEvaluations: 0,
    openAlerts: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [seenNotificationKey, setSeenNotificationKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const [dashboard, releases] = await Promise.all([
          fetchJson("/api/dashboard"),
          fetchJson("/api/releases").catch(() => ({ alerts: [] })),
        ]);
        if (cancelled) return;
        setNotice({
          loading: false,
          pendingReviews: Number(dashboard.pendingReviews ?? 0),
          activeGrayReleases: Number(dashboard.activeGrayReleases ?? 0),
          totalPrompts: Number(dashboard.totalPrompts ?? 0),
          completedEvaluations: Number(dashboard.completed ?? 0),
          openAlerts: Array.isArray(releases.alerts) ? releases.alerts.length : 0,
          latestRunStatus: dashboard.recentRuns?.[0]?.status,
        });
      } catch {
        if (!cancelled) {
          setNotice((current) => ({ ...current, loading: false }));
        }
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentOption = currentExportOption(pathname);
  const notificationCount = notice.pendingReviews + notice.activeGrayReleases + notice.openAlerts;
  const notificationKey = [
    notice.pendingReviews,
    notice.activeGrayReleases,
    notice.openAlerts,
    notice.latestRunStatus ?? "idle",
  ].join(":");
  const hasUnreadNotifications = !notice.loading && notificationCount > 0 && seenNotificationKey !== notificationKey;

  useEffect(() => {
    setSeenNotificationKey(window.localStorage.getItem("promptguard:seen-notifications") ?? "");
  }, []);

  function markNotificationsSeen() {
    if (notice.loading) return;
    setSeenNotificationKey(notificationKey);
    window.localStorage.setItem("promptguard:seen-notifications", notificationKey);
  }

  async function exportOption(option: ExportOption) {
    setExporting(true);
    setExportMessage("");
    try {
      const data = await fetchJson(option.endpoint);
      downloadJson(option.filePrefix, {
        exportedAt: new Date().toISOString(),
        source: option.endpoint,
        data,
      });
      setExportMessage("已导出");
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  async function exportWorkspaceSnapshot() {
    setExporting(true);
    setExportMessage("");
    try {
      const sources = EXPORT_OPTIONS.filter((option) => option.endpoint !== "/api/settings");
      const settled = await Promise.allSettled(sources.map((option) => fetchJson(option.endpoint)));
      const snapshot = Object.fromEntries(
        sources.map((option, index) => [
          option.filePrefix,
          settled[index].status === "fulfilled"
            ? settled[index].value
            : { error: settled[index].reason instanceof Error ? settled[index].reason.message : "失败" },
        ]),
      );
      downloadJson("workspace-snapshot", {
        exportedAt: new Date().toISOString(),
        source: "workspace",
        data: snapshot,
      });
      setExportMessage("快照已导出");
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  async function shareCurrentPage() {
    const url = window.location.href;
    const title = `PromptGuard - ${activeLabel}`;
    setShareMessage("");
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("链接已复制");
      if (navigator.share) {
        await navigator.share({ title, text: "PromptGuard 工作台页面", url }).catch((error) => {
          if (!(error instanceof Error) || error.name !== "AbortError") throw error;
        });
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage("链接已复制");
      } catch {
        setShareMessage("复制失败");
      }
    }
  }

  return (
    <div
      className="relative flex items-center gap-2"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setOpenPanel(null);
        }
      }}
    >
      <button
        className="relative hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/62 transition hover:bg-white/[0.08] hover:text-white sm:flex"
        aria-expanded={openPanel === "notifications"}
        aria-label="通知"
        type="button"
        onClick={() => {
          setOpenPanel((panel) => {
            const next = panel === "notifications" ? null : "notifications";
            if (next === "notifications") markNotificationsSeen();
            return next;
          });
        }}
      >
        <Iconify icon="solar:bell-linear" width="19" />
        {hasUnreadNotifications && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff765f] shadow-[0_0_12px_rgba(255,118,95,0.9)]" />
        )}
      </button>

      <button
        className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/62 transition hover:bg-white/[0.08] hover:text-white sm:flex"
        aria-expanded={openPanel === "export"}
        aria-label="导出"
        type="button"
        onClick={() => setOpenPanel((panel) => panel === "export" ? null : "export")}
      >
        <Iconify icon="solar:upload-square-linear" width="19" />
      </button>

      <button
        className="hidden rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#17181d] shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition hover:bg-[#f4f2ff] lg:inline-flex"
        type="button"
        onClick={shareCurrentPage}
      >
        {shareMessage || "分享"}
      </button>

      {openPanel === "notifications" && (
        <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#181920]/96 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <div className="text-sm font-semibold text-white">通知</div>
              <div className="text-xs text-white/38">{notice.loading ? "正在同步工作台状态" : `${notificationCount} 条待关注`}</div>
            </div>
            <Link href="/audit" className="text-xs font-medium text-[#8a7dff] transition hover:text-white" onClick={() => setOpenPanel(null)}>
              审计
            </Link>
          </div>

          <div className="grid gap-2">
            <Link href="/reviews" className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3 transition hover:bg-white/[0.06]" onClick={() => setOpenPanel(null)}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">审核队列</span>
                <span className="rounded-full bg-[#262832] px-2 py-0.5 text-xs text-[#ffe36e]">{notice.pendingReviews}</span>
              </div>
              <div className="mt-1 text-xs text-white/40">待处理提示词审核</div>
            </Link>
            <Link href="/releases" className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3 transition hover:bg-white/[0.06]" onClick={() => setOpenPanel(null)}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">发布监控</span>
                <span className="rounded-full bg-[#262832] px-2 py-0.5 text-xs text-[#55e18e]">{notice.activeGrayReleases}</span>
              </div>
              <div className="mt-1 text-xs text-white/40">{notice.openAlerts} 条开放告警</div>
            </Link>
            <Link href="/evaluations" className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3 transition hover:bg-white/[0.06]" onClick={() => setOpenPanel(null)}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">评测任务</span>
                <span className="rounded-full bg-[#262832] px-2 py-0.5 text-xs text-white/58">{notice.completedEvaluations}</span>
              </div>
              <div className="mt-1 text-xs text-white/40">最近状态：{getStatusLabel(notice.latestRunStatus ?? "idle")}</div>
            </Link>
          </div>
        </div>
      )}

      {openPanel === "export" && (
        <div className="absolute right-0 top-12 z-50 w-[330px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#181920]/96 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-2 px-1">
            <div className="text-sm font-semibold text-white">导出</div>
            <div className="text-xs text-white/38">{exportMessage || "下载 JSON 数据"}</div>
          </div>
          <div className="grid gap-2">
            <button
              className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={exporting}
              onClick={() => exportOption(currentOption)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">当前页面</span>
                <Iconify icon="solar:download-square-linear" width="17" />
              </div>
              <div className="mt-1 text-xs text-white/40">{currentOption.label}</div>
            </button>
            <button
              className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={exporting}
              onClick={exportWorkspaceSnapshot}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">工作台快照</span>
                <Iconify icon="solar:archive-down-linear" width="17" />
              </div>
              <div className="mt-1 text-xs text-white/40">总览、提示词、数据集、扫描与发布</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarUtilities() {
  const pathname = usePathname();
  const [isFavorite, setIsFavorite] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const favorites = readFavorites();
    setIsFavorite(favorites.includes(pathname));
  }, [pathname]);

  useEffect(() => {
    const enabled = window.localStorage.getItem("promptguard:focus-mode") === "true";
    setFocusMode(enabled);
    document.documentElement.classList.toggle("promptguard-focus-mode", enabled);
  }, []);

  function toggleFavorite() {
    const favorites = readFavorites();
    const next = favorites.includes(pathname)
      ? favorites.filter((item) => item !== pathname)
      : [pathname, ...favorites.filter((item) => item !== pathname)].slice(0, 8);

    window.localStorage.setItem("promptguard:favorites", JSON.stringify(next));
    setIsFavorite(next.includes(pathname));
  }

  function toggleFocusMode() {
    const next = !focusMode;
    setFocusMode(next);
    window.localStorage.setItem("promptguard:focus-mode", String(next));
    document.documentElement.classList.toggle("promptguard-focus-mode", next);
  }

  return (
    <div className="flex items-center justify-between rounded-[18px] border border-white/[0.07] bg-[#16171d] p-2">
      <Link
        href="/reports"
        title="报告"
        aria-label="报告"
        className="flex h-9 w-9 items-center justify-center rounded-[13px] text-white/46 transition hover:bg-white/[0.06] hover:text-white"
      >
        <Iconify icon="solar:document-text-linear" width="17" />
      </Link>
      <Link
        href="/evaluations"
        title="评测"
        aria-label="评测"
        className="flex h-9 w-9 items-center justify-center rounded-[13px] text-white/46 transition hover:bg-white/[0.06] hover:text-white"
      >
        <Iconify icon="solar:chart-square-linear" width="17" />
      </Link>
      <button
        title={isFavorite ? "取消收藏" : "收藏当前页"}
        aria-label={isFavorite ? "取消收藏" : "收藏当前页"}
        className={`flex h-9 w-9 items-center justify-center rounded-[13px] transition ${
          isFavorite ? "bg-[#ffe36e]/16 text-[#ffe36e]" : "text-white/46 hover:bg-white/[0.06] hover:text-white"
        }`}
        type="button"
        onClick={toggleFavorite}
      >
        <Iconify icon={isFavorite ? "solar:bookmark-bold" : "solar:bookmark-linear"} width="17" />
      </button>
      <button
        title={focusMode ? "退出专注模式" : "专注模式"}
        aria-label={focusMode ? "退出专注模式" : "专注模式"}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_10px_22px_rgba(112,103,255,0.38)] transition ${
          focusMode ? "bg-[#55e18e]" : "bg-[#7067ff] hover:bg-[#8179ff]"
        }`}
        type="button"
        onClick={toggleFocusMode}
      >
        <Iconify icon={focusMode ? "solar:sun-fog-linear" : "solar:moon-fog-linear"} width="18" />
      </button>
    </div>
  );
}

function readFavorites() {
  try {
    const value = JSON.parse(window.localStorage.getItem("promptguard:favorites") ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function TemplateNav() {
  const pathname = usePathname();
  const activeLink = NAV_LINKS.find((link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) ?? NAV_LINKS[0];
  const isActiveHref = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const secondaryLinks = NAV_LINKS.slice(6);
  const primaryLinks = NAV_LINKS.slice(0, 6);
  const quickLinks = [
    { href: "/prompts", icon: "solar:document-text-linear", label: "Prompt 资产" },
    { href: "/evaluations", icon: "solar:chart-square-linear", label: "评测统计" },
    { href: "/reviews", icon: "solar:bookmark-linear", label: "审核收藏" },
  ];

  return (
    <>
      <header className="fixed left-3 right-3 top-3 z-50 h-14 rounded-[22px] border border-white/[0.07] bg-[#1b1c22]/88 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:left-[304px]">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-4 w-4 rounded-full border-2 border-[#7067ff] shadow-[0_0_22px_rgba(112,103,255,0.65)]" />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">{activeLink.label}</div>
              <div className="truncate text-[11px] text-white/36">Web 控制台 / PromptGuard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <select
                className="h-9 rounded-2xl border border-white/10 bg-[#202127] px-3 text-xs text-white/70 outline-none"
                value={activeLink.href}
                onChange={(event) => {
                  window.location.href = event.target.value;
                }}
              >
                {NAV_LINKS.map((link) => (
                  <option key={link.href} value={link.href}>
                    {link.label}
                  </option>
                ))}
              </select>
            </div>
            <HeaderActions activeLabel={activeLink.label} />
            <AuthStatus />
          </div>
        </div>
      </header>

      <aside className="fixed bottom-3 left-3 top-3 z-40 hidden w-[276px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#202127]/78 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl md:block">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.014))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_2%,rgba(112,103,255,0.16),transparent_34%)]" />
        <div className="relative flex h-full flex-col p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 aspect-square items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#67e8f9,#7067ff)] text-lg font-bold text-white shadow-[0_16px_34px_rgba(112,103,255,0.34)]">
              PG
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">PromptGuard</div>
              <div className="truncate text-xs text-white/38">提示词防护工作台</div>
            </div>
            <Link className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/24 text-white/42 transition hover:bg-white/[0.06] hover:text-white" href="/settings" aria-label="设置" title="设置">
              <Iconify icon="solar:settings-minimalistic-linear" width="16" />
            </Link>
          </div>

          <NavSearch variant="side" placeholder="搜索页面" />

          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/28">总览</div>
          <nav className="space-y-1.5">
            {primaryLinks.map((link, index) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-label={link.label}
                  className={
                    active
                      ? "flex h-11 items-center gap-3 rounded-[16px] bg-[#7067ff] px-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(112,103,255,0.38)]"
                      : "flex h-11 items-center gap-3 rounded-[16px] px-3 text-sm font-medium text-white/58 transition hover:bg-white/[0.05] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="19" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {active ? <Iconify icon="solar:alt-arrow-up-linear" width="15" /> : index === 1 ? <span className="h-2 w-2 rounded-full bg-[#ff765f]" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-1.5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/28">工作区</div>
            {secondaryLinks.map((link, index) => {
              const active = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "flex h-10 items-center gap-3 rounded-[15px] bg-white/[0.08] px-3 text-sm font-medium text-white"
                      : "flex h-10 items-center gap-3 rounded-[15px] px-3 text-sm font-medium text-white/48 transition hover:bg-white/[0.05] hover:text-white"
                  }
                >
                  <Iconify icon={link.icon} width="18" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {index === 0 && <span className="rounded-full bg-[#262832] px-2 py-0.5 text-[11px] text-[#ffe36e]">4</span>}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-3">
            <SidebarUtilities />
            <Link
              href="/prompts"
              aria-current={isActiveHref("/prompts") ? "page" : undefined}
              aria-label="新增 Prompt"
              title="新增 Prompt"
              className={
                isActiveHref("/prompts")
                  ? "flex h-[120px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#7067ff]/60 bg-[#1c1d26] text-center shadow-[0_16px_34px_rgba(112,103,255,0.16)] transition hover:border-[#8276ff]/70"
                  : "flex h-[120px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/18 bg-[#15161b]/72 text-center transition hover:border-[#7067ff]/55 hover:bg-[#1c1d26]"
              }
            >
              <span className={
                isActiveHref("/prompts")
                  ? "mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#8276ff] text-white shadow-[0_12px_26px_rgba(112,103,255,0.50)]"
                  : "mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#7067ff] text-white shadow-[0_12px_26px_rgba(112,103,255,0.42)]"
              }>
                <Iconify icon="solar:add-circle-linear" width="21" />
              </span>
              <span className="text-sm font-medium text-white">新建提示词</span>
              <span className="mt-1 text-xs text-white/36">也可进入导入入口</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
