# PromptGuard SDK Demo: 售后对话系统

这个小项目模拟一个真实业务里的“带系统提示词的对话系统”。它展示的不是 PromptGuard 主平台，而是业务项目如何把 PromptGuard 当 SDK 接进去。

## 运行

在仓库根目录先构建 core：

```bash
pnpm --filter @promptguard/core build
```

进入 demo：

```bash
cd pre/support-chat-system
node server.mjs
```

打开：

```text
http://localhost:4317
```

## 演示点

- `直接调用模型`：业务代码里有一个普通的 `systemPrompt` / `BUSINESS_PROMPT` 变量，然后直接拼进 messages。攻击样例会把 PM 套出来。
- `使用 PromptGuard SDK`：业务代码不直接暴露 PM，而是用 `GuardedPrompt.load()` 从资产库加载，SDK 会做输入拦截、protected prompt 包装和输出泄露检测。

两种模式都会使用主项目 `.env` 里的 OpenAI-compatible 配置真实请求模型：

```env
LLM_PROVIDER=openai
OPENAI_BASE_URL=...
OPENAI_WIRE_API=responses
OPENAI_MODEL=gpt-5.5
OPENAI_API_KEY=...
```

区别在于：直接调用模式会把 PM 作为普通 `systemPrompt` 变量发送给模型；SDK 模式遇到提示词逆向时会在模型调用前拦截，本次不会发送 PM。

## 关键代码

```js
import { GuardedPrompt } from "../../packages/core/dist/index.js";

const prompt = await GuardedPrompt.load("pre-售后对话助手", {
  environment: "production",
  routeKey: "pre-demo-user",
});

const result = await prompt.run(userInput, {
  runner: demoBusinessRunner,
});
```

对照的直接调用写法在 demo 里是：

```js
const systemPrompt = BUSINESS_PROMPT;
const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: userInput },
];
```

这个写法里 PM 只是普通变量，模型一旦被诱导就可能把它输出。接入 SDK 后，业务系统只需要把原本手写在代码里的 PM 放进 PromptGuard 资产库，然后通过 SDK 加载和运行。SDK 会处理：

- 版本选择
- 灰度路由
- protected system prompt 包装
- 输入注入检测
- 输出泄露检测
- finding 返回
