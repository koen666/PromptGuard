# PromptGuard

面向 LLM 应用的 **Prompt 版本评测与灰度发布** 平台。

将 Prompt 作为可版本化、可评测、可审核、可灰度、可回滚的软件资产进行管理。提供 **Web 管理界面** 与 **CLI** 双入口，共享同一套业务逻辑与 SQLite 数据库。

---

## 目录

- [功能概览](#功能概览)
- [环境要求](#环境要求)
- [从零复现（推荐流程）](#从零复现推荐流程)
- [一键安装脚本（Windows）](#一键安装脚本windows)
- [日常开发](#日常开发)
- [生产构建与运行](#生产构建与运行)
- [配置说明](#配置说明)
- [演示流程（给验收 / 答辩用）](#演示流程给验收--答辩用)
- [CLI 常用命令](#cli-常用命令)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [常见问题](#常见问题)
- [打包交付说明](#打包交付说明)

---

## 功能概览

| 模块 | 说明 |
|------|------|
| Prompt 资产 | 创建、编辑、自动版本号、diff 对比、回滚 |
| 评测数据集 | 用例管理、JSON 导入 |
| 自动评测 | 默认 Mock；可选 OpenAI / Anthropic |
| 安全扫描 | 诱导测试与泄露风险检测 |
| 审核工作流 | 提交 → 通过 / 拒绝 |
| 灰度发布 | 流量比例、观察指标、一键回滚 |
| 报告导出 | JSON / HTML（写入 `reports/`） |
| 审计日志 | 关键操作自动记录 |

Web 界面基于 `generated-page.html` 模板（深色科技风），首页串联模板各展示模块并接入真实业务数据。

---

## 环境要求

| 依赖 | 版本 |
|------|------|
| **Node.js** | 20 及以上（推荐 LTS） |
| **pnpm** | 9+（仓库锁定 `pnpm@9.15.4`） |
| **操作系统** | Windows / macOS / Linux 均可 |

> **Windows 注意**：`better-sqlite3` 为原生模块，首次 `pnpm install` 需要能编译 C++（通常 Node 安装包已带构建工具；若失败，可安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 并勾选「使用 C++ 的桌面开发」）。

检查版本：

```powershell
node -v    # 应 >= v20
pnpm -v    # 应 >= 9
```

未安装 pnpm 时（Node 16.13+）：

```powershell
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

---

## 从零复现（推荐流程）

在**项目根目录**（含 `package.json`、`pnpm-workspace.yaml` 的目录）依次执行：

### 1. 安装依赖

```powershell
pnpm install
```

### 2. 环境变量

```powershell
copy .env.example .env
```

默认无需改即可运行（Mock LLM + 本地 SQLite）。需要真实模型时再改 `.env`。

### 3. 数据库迁移

```powershell
pnpm db:migrate
```

会在 `data/` 下创建 `promptguard.db`（该目录已在 `.gitignore` 中，不会随 zip 分发，需本地执行迁移生成）。

### 4. （可选）灌入演示数据

```powershell
pnpm seed
```

### 5. 启动开发服务器

```powershell
pnpm dev
```

浏览器打开：**http://localhost:3000**

### 6. 验证构建（可选，确认能交付）

```powershell
pnpm build
```

---

## 一键安装脚本（Windows）

PowerShell 在项目根目录执行：

```powershell
.\scripts\setup.ps1
```

带演示数据：

```powershell
.\scripts\setup.ps1 -Seed
```

脚本会：检查 Node/pnpm → `pnpm install` → 复制 `.env` → `pnpm db:migrate` →（可选）`pnpm seed`。

---

## 日常开发

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 编译 core + 启动 Next.js 开发服（:3000） |
| `pnpm build` | 全仓 TypeScript / Next 生产构建 |
| `pnpm typecheck` | 各包类型检查 |
| `pnpm db:generate` | 修改 schema 后生成 Drizzle 迁移（开发用） |
| `pnpm db:migrate` | 应用迁移到 SQLite |
| `pnpm seed` | 重置并写入演示数据 |
| `pnpm cli -- <子命令>` | 调用 CLI |

**Web 路由一览**

| 路径 | 页面 |
|------|------|
| `/` | 首页 Dashboard（模板 Hero + 统计） |
| `/prompts` | Prompt 列表 |
| `/prompts/[id]` | Prompt 详情 / 编辑 |
| `/prompts/[id]/diff` | 版本 diff |
| `/datasets` | 数据集 |
| `/evaluations` | 评测任务 |
| `/reports/[id]` | 评测报告 |
| `/security` | 安全扫描 |
| `/reviews` | 审核 |
| `/releases` | 灰度发布 |
| `/audit` | 审计日志 |
| `/settings` | 设置 |

---

## 生产构建与运行

```powershell
pnpm build
pnpm --filter @promptguard/web start
```

默认监听 **http://localhost:3000**。部署时设置 `PORT` 环境变量即可改端口。

---

## 配置说明

`.env` 字段（见 `.env.example`）：

```env
DATABASE_URL=./data/promptguard.db
LLM_PROVIDER=mock          # mock | openai | anthropic
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

- 未配置 API Key 或 `LLM_PROVIDER=mock` 时，评测与安全扫描使用 **Mock 模拟器**，适合零成本演示。
- 使用真实 API 时填写对应 Key，并将 `LLM_PROVIDER` 改为 `openai` 或 `anthropic`。

---

## 演示流程（给验收 / 答辩用）

1. `pnpm seed`（若库为空）
2. 打开首页 `/`，查看统计与模板展示区块
3. **Prompts** → 进入某 Prompt → 编辑保存 → 自动生成新版本 → **Diff** 页对比
4. **Datasets** 确认用例 → **Evaluations** 发起评测 → 打开报告页查看图表
5. **Reviews** 提交并通过审核
6. **Releases** 创建 10% 灰度 → 观察指标 → 必要时回滚
7. **Audit** 查看操作记录

CLI 等价示例：

```powershell
pnpm cli -- init
pnpm cli -- prompt list
pnpm cli -- eval run --prompt <promptId> --version 1 --dataset <datasetId>
pnpm cli -- report generate --run <runId> --format html
```

---

## CLI 常用命令

```powershell
pnpm cli -- init                          # 初始化数据库（通常用 db:migrate 即可）
pnpm cli -- prompt list
pnpm cli -- prompt create --name "..." --content "..."
pnpm cli -- dataset list
pnpm cli -- eval run --prompt <id> --version 1 --dataset <id>
pnpm cli -- security scan --prompt <id> --version 1
pnpm cli -- review submit --prompt <id> --version 1
pnpm cli -- release start --prompt <id> --version 1 --percent 10
pnpm cli -- report generate --run <id> --format html
```

加 `--help` 查看各子命令参数。

---

## 项目结构

```
PromptGuard/
├── apps/
│   ├── web/                 # Next.js 15 管理界面
│   │   ├── app/             # App Router 页面与 API Routes
│   │   └── components/
│   │       └── template/    # generated-page.html 模板组件
│   └── cli/                 # Commander.js CLI
├── packages/
│   └── core/                # 业务逻辑、SQLite、Drizzle、LLM 适配器
│       ├── src/
│       └── drizzle/         # SQL 迁移（0000_init.sql）
├── scripts/
│   ├── setup.ps1            # Windows 一键安装
│   └── package.ps1          # 打 zip 交付包
├── data/                    # SQLite（本地生成，不提交 git）
├── reports/                 # 导出报告（本地生成）
├── generated-page.html      # UI 模板参考源文件
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

**架构关系**

```
apps/web (UI + API) ──┐
apps/cli (命令行)  ──┼──► @promptguard/core ──► SQLite (data/promptguard.db)
                     └──► LLM 适配器 (mock / openai / anthropic)
```

---

## 技术栈

- **Monorepo**：pnpm workspace · TypeScript
- **Web**：Next.js 15 · React 19 · Tailwind CSS 4 · Recharts · Iconify
- **数据**：SQLite · Drizzle ORM · better-sqlite3
- **CLI**：Commander.js

---

## 常见问题

### 开发服 500 / `MODULE_NOT_FOUND`（.next 缓存损坏）

常见于异常退出或多开 `pnpm dev`：

```powershell
# 先停止所有 dev 进程，再删缓存
Remove-Item -Recurse -Force apps\web\.next
pnpm dev
```

### 端口 3000 被占用

```powershell
# 查看占用
netstat -ano | findstr :3000
# 结束进程（将 PID 换成上一步看到的）
taskkill /PID <PID> /F
```

或临时指定端口：

```powershell
$env:PORT=3001; pnpm --filter @promptguard/web dev
```

### `better-sqlite3` 安装失败

- 确认 Node 为 20+ 64 位
- Windows 安装 Visual Studio Build Tools（C++ 工作负载）
- 删除 `node_modules` 后重新 `pnpm install`

### 数据库为空 / 表不存在

```powershell
pnpm db:migrate
pnpm seed
```

### 修改了 Drizzle schema

```powershell
pnpm db:generate   # 生成新迁移文件
pnpm db:migrate    # 应用到本地库
```

### 首页 Mission 筛选器

当前为模板 UI 展示，**尚未接入列表过滤**，后续可在 `apps/web` 接 API 实现。

---

## 打包交付说明

### 接收 zip 后的复现步骤

1. 解压到任意目录（路径不要含特殊字符）
2. 按上文 [从零复现](#从零复现推荐流程) 或运行 `.\scripts\setup.ps1 -Seed`
3. `pnpm dev` → 打开 http://localhost:3000

### 自行打 zip（维护者）

在项目根目录：

```powershell
.\scripts\package.ps1
```

会在**上一级目录**生成 `PromptGuard-handover.zip`，已排除：

- `node_modules`、`.next`、`dist`
- `data/`、`reports/`、`.env`
- 各类日志与系统缓存

**zip 内不含数据库与依赖**，接收方必须本地执行 `pnpm install` 与 `pnpm db:migrate`。

### 若通过 Git 交接

克隆后直接 `pnpm install` → `copy .env.example .env` → `pnpm db:migrate` → `pnpm seed` → `pnpm dev` 即可。

---

## 许可证

课程 / 团队内部项目，接手同学请与原作者确认对外分发规则。
