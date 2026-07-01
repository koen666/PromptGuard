# PromptGuard Core 自动化测试子系统

本目录只测试 `@promptguard/core` 中不依赖数据库和外部网络的核心逻辑，不会连接或修改团队 MySQL 数据库，也不会调用真实模型 API。

## 覆盖范围

- 数据集 JSON/CSV 解析、异常格式和预览；
- 500/501 条用例、10MB 文件和字段类型边界；
- 敏感信息识别、误报控制和证据脱敏；
- Mock LLM 的确定性、计分和安全判断；
- Vitest JSON 结果、覆盖率和 Markdown 汇总。

## 执行命令

在仓库根目录运行：

```powershell
corepack.cmd pnpm --filter @promptguard/core test
corepack.cmd pnpm --filter @promptguard/core test:coverage
corepack.cmd pnpm --filter @promptguard/core typecheck:test
corepack.cmd pnpm --filter @promptguard/core test:report
corepack.cmd pnpm --filter @promptguard/core test:all
```

测试产物生成在仓库根目录的 `test-artifacts/`，该目录已加入 `.gitignore`，不会进入提交。

## 设计原则

1. 测试数据完全确定，避免随机值造成偶发失败。
2. 单元测试只调用纯函数或 Mock Adapter，不依赖数据库状态。
3. 结果汇总工具会校验计数一致性，不会把损坏的结果文件误报为成功。
4. 覆盖率报告包含文本、HTML、LCOV 和 JSON Summary，可供人工检查或后续 CI 使用。
