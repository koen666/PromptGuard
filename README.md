# PromptGuard

面向 LLM 应用的 **Prompt 核心资产保护库**。

将 Prompt 作为可导入、可版本化、可运行时防护、可评测、可审核、可灰度、可回滚的软件资产进行管理。项目提供三层入口：

- **SDK / Library**：业务代码可直接加载 `GuardedPrompt`，运行时自动包装系统 Prompt、拦截注入输入、检查输出泄露。
- **CLI**：初始化 `.promptguard` 项目、从文件导入/导出 Prompt、保存版本、运行评测/安全扫描/灰度发布。
- **Desktop-style Web**：左侧 dock + 桌面窗口式工作台，展示资产库、运行队列和保护状态。

---

## 目录

- [功能概览](#功能概览)
- [SDK 用法](#sdk-用法)
- [pre SDK 对照演示](#pre-sdk-对照演示)
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
| 可导入 SDK | TypeScript `GuardedPrompt` 与轻量 Python SDK |
| 运行时保护 | 输入注入检测、受保护系统 Prompt 包装、输出泄露检查 |
| Prompt 资产 | 创建、编辑、自动版本号、diff 对比、回滚 |
| 评测数据集 | 用例管理、JSON 导入 |
| 自动评测 | 默认 Mock；可选 OpenAI / Anthropic |
| 安全扫描 | 诱导测试、泄露风险检测、GPT 结构化安全评审 |
| Prompt 自动优化 | 基于安全 finding 生成修复建议和新版 Prompt 草案，可一键保存为新版本 |
| 审核工作流 | 提交 → 通过 / 拒绝 |
| 灰度发布 | 流量比例、观察指标、一键回滚 |
| 报告导出 | JSON / HTML（写入 `reports/`） |
| 审计日志 | 关键操作自动记录 |

Web 首页已改为桌面软件式资产工作台：首屏突出当前核心 Prompt、运行时防护状态、快速动作、资产库和运行队列。

---

## SDK 用法

### TypeScript

```ts
import { GuardedPrompt } from "@promptguard/core";

const prompt = await GuardedPrompt.load("customer-service", {
  environment: "production",
  routeKey: user.id,
});

const response = await prompt.run(userInput);
console.log(response.output);
```

默认会使用项目配置的 LLM adapter。也可以传入自定义 runner：

```ts
const response = await prompt.run(userInput, {
  runner: async ({ messages }) => {
    return callYourModel(messages);
  },
});
```

### Python

```python
from promptguard import GuardedPrompt

prompt = GuardedPrompt.load("customer-service")
response = prompt.run(user_input)
print(response.output)
```

本地开发安装：

```powershell
pip install -e packages/python
```

Python SDK 默认读取同一份 SQLite 数据库。可通过 `DATABASE_URL` 或 `PROMPTGUARD_ROOT` 指向业务项目。

---

## pre SDK 对照演示

`pre/support-chat-system` 是一个独立的小业务项目，用来演示“裸调用模型”和“接入 PromptGuard SDK”两种写法的差异。

### 演示目标

- **直接调用模型**：业务代码把 PM 写成普通 `systemPrompt` / `BUSINESS_PROMPT` 变量，再拼进 `messages`。提示词逆向样例会展示 PM 被套出的结果。
- **使用 PromptGuard SDK**：业务代码通过 `GuardedPrompt.load()` 从 PromptGuard 资产库加载 PM，并由 SDK 执行输入拦截、protected runtime 包装和输出泄露检测。

### 运行方式

先在仓库根目录构建 core：

```powershell
pnpm --filter @promptguard/core build
```

启动 pre demo：

```powershell
cd pre/support-chat-system
node server.mjs
```

浏览器打开：

```text
http://localhost:4317
```

### 代码落点

| 文件 | 作用 |
|------|------|
| `pre/support-chat-system/server.mjs` | 后端 demo 服务，包含 direct / sdk 两条调用链 |
| `pre/support-chat-system/public/index.html` | 两种模式切换、样例按钮和右侧状态面板 |
| `pre/support-chat-system/public/app.js` | 发送消息、展示 blocked / PM Sent / findings / 打字机效果 |
| `pre/support-chat-system/public/styles.css` | 桌面式深色 UI 和毛玻璃侧栏样式 |

direct 模式的核心代码：

```js
const systemPrompt = BUSINESS_PROMPT;
const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: message },
];
```

SDK 模式的核心代码：

```js
const prompt = await GuardedPrompt.load("pre-售后对话助手", {
  environment: "production",
  routeKey: "pre-demo-user",
});

const result = await prompt.run(message, {
  blockUnsafeInput: true,
  runner: realModelRunner,
});
```

同一条逆向样例在两个模式下的对照：

| 模式 | 结果 |
|------|------|
| 直接调用模型 | `PM Sent = yes`，PM 会以普通变量形式被展示出来 |
| PromptGuard SDK | `Blocked = yes`，`PM Sent = no`，模型调用前被 SDK 拦截 |

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
| `/` | 桌面式资产工作台 |
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
LLM_PROVIDER=mock          # mock | openai | anthropic | ollama
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_BASE_URL=https://api.openai.com
OPENAI_WIRE_API=responses
OPENAI_MODEL=gpt-5.5
OPENAI_REVIEW_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=xhigh
OPENAI_DISABLE_RESPONSE_STORAGE=true
OPENAI_FALLBACK_TO_MOCK=false
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

- 未配置 API Key 或 `LLM_PROVIDER=mock` 时，评测与安全扫描使用 **Mock 模拟器**，适合零成本演示。
- 使用真实 API 时填写对应 Key，并将 `LLM_PROVIDER` 改为 `openai` 或 `anthropic`。
- `OPENAI_BASE_URL` 支持 OpenAI-compatible 网关；未以 `/v1` 结尾时系统会自动拼接 `/v1`。
- `OPENAI_WIRE_API=responses` 时会请求 `/v1/responses`，并在 `OPENAI_DISABLE_RESPONSE_STORAGE=true` 时发送 `store=false`。
- `OPENAI_FALLBACK_TO_MOCK=false` 表示真实模型调用失败时直接报错，避免安全审核误用 mock 结果。

---

## 演示流程（给验收 / 答辩用）

1. `pnpm seed`（若库为空）
2. 打开首页 `/`，查看核心 Prompt、运行队列、资产库与防护状态
3. **Prompts** → 进入某 Prompt → 编辑保存 → 自动生成新版本 → **Diff** 页对比
4. **CLI** → 从 `.promptguard/prompts/*.md` 导入 Prompt，并用 `prompt run` 验证运行时防护
5. **Datasets** 确认用例 → **Evaluations** 发起评测 → 打开报告页查看图表
6. **Reviews** 提交并通过审核
7. **Releases** 创建 10% 灰度 → 观察指标 → 必要时回滚
8. **Audit** 查看操作记录

CLI 等价示例：

```powershell
pnpm cli -- init
pnpm cli -- project init --sample
pnpm cli -- prompt list
pnpm cli -- prompt import --file .promptguard/prompts/customer-service.md --tags customer-service,production
pnpm cli -- prompt run customer-service --input "我的订单什么时候到？"
pnpm cli -- security scan --prompt <promptId> --version 1
pnpm cli -- security optimize --scan <scanId> --apply
pnpm cli -- eval run --prompt <promptId> --version 1 --dataset <datasetId>
pnpm cli -- report generate --run <runId> --format html
```

---

## CLI 常用命令

```powershell
pnpm cli -- init                          # 初始化数据库（通常用 db:migrate 即可）
pnpm cli -- project init --sample          # 初始化 .promptguard 项目目录
pnpm cli -- prompt list
pnpm cli -- prompt create --name "..." --content "..."
pnpm cli -- prompt create --name "..." --file .promptguard/prompts/foo.md
pnpm cli -- prompt import --file .promptguard/prompts/foo.md --tags prod,agent
pnpm cli -- prompt export <id> --file .promptguard/prompts/foo.md
pnpm cli -- prompt save <id> --file .promptguard/prompts/foo.md --changelog "tighten policy"
pnpm cli -- prompt run <id-or-name> --input "hello"
pnpm cli -- dataset list
pnpm cli -- eval run --prompt <id> --version 1 --dataset <id>
pnpm cli -- security scan --prompt <id> --version 1
pnpm cli -- review submit --prompt <id> --version 1
pnpm cli -- release start --prompt <id> --prompt-version 1 --percent 10 --note "canary"
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
│   │       └── template/    # 桌面式应用外壳与通用组件
│   └── cli/                 # Commander.js CLI
├── packages/
│   ├── core/                # SDK 运行时、业务逻辑、SQLite、Drizzle、LLM 适配器
│   │   ├── src/
│   │   └── drizzle/         # SQL 迁移（0000_init.sql）
│   └── python/              # Python SDK：from promptguard import GuardedPrompt
├── pre/
│   └── support-chat-system/ # SDK 接入对照 demo：direct 模式 vs PromptGuard SDK 模式
├── scripts/
│   ├── setup.ps1            # Windows 一键安装
│   └── package.ps1          # 打 zip 交付包
├── data/                    # SQLite（本地生成，不提交 git）
├── reports/                 # 导出报告（本地生成）
├── generated-page.html      # 历史 UI 参考源文件
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

**架构关系**

```
apps/web (UI + API) ──┐
apps/cli (命令行)  ──┼──► @promptguard/core ──► SQLite (data/promptguard.db)
packages/python SDK ─┘                         └──► LLM 适配器 (mock / openai / anthropic)
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
