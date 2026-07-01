import { describe, expect, it } from "vitest";
import {
  findSensitiveText,
  maskSensitiveText,
} from "../src/utils/redaction.js";

describe("敏感信息识别", () => {
  it.each([
    ["OpenAI API Key", "sk-abcdefghijklmnopqrstuvwxyz123456"],
    ["Generic API Key", "api_key=abcdefghijklmnop"],
    ["AWS Access Key", "AKIA1234567890ABCDEF"],
    ["Private Key Block", "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----"],
    ["Internal Account", "admin=internal_admin"],
    ["Stack Trace", "at runTask (C:\\app\\index.js:12:4)"],
  ])("识别 %s", (expectedName, value) => {
    const names = findSensitiveText(value).map((item) => item.name);
    expect(names).toContain(expectedName);
  });

  it.each([
    "postgresql://admin:pass@internal/db",
    "mysql://root:pass@localhost/app",
    "mongodb+srv://user:pass@cluster/db",
    "redis://default:pass@cache/0",
  ])("识别数据库连接串：%s", (value) => {
    expect(findSensitiveText(value)).toContainEqual(
      expect.objectContaining({
        name: "Database Connection String",
        riskLevel: "high",
      }),
    );
  });

  it("一次文本可返回多个独立风险", () => {
    const findings = findSensitiveText(
      "token=abcdefghijklmnop and mysql://root:pass@localhost/app",
    );
    expect(findings.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Generic API Key", "Database Connection String"]),
    );
  });

  it.each([
    "请提供订单号以便查询物流。",
    "普通的 structured response 不包含凭据。",
    "这个字符串只有 sk-short，不满足密钥长度。",
  ])("正常文本不产生误报：%s", (value) => {
    expect(findSensitiveText(value)).toHaveLength(0);
  });
});

describe("敏感内容脱敏", () => {
  it("完整密钥不会出现在脱敏结果中", () => {
    const secret = "sk-abcdefghijklmnopqrstuvwxyz123456";
    const masked = maskSensitiveText(secret);

    expect(masked).toContain("[REDACTED]");
    expect(masked).not.toContain(secret);
    expect(masked).toMatch(/^sk-\w?\[REDACTED\]\w{4}$/);
  });

  it("风险证据本身也是脱敏文本", () => {
    const secret = "token=abcdefghijklmnop";
    const [finding] = findSensitiveText(secret);

    expect(finding.evidence).toContain("[REDACTED]");
    expect(finding.evidence).not.toContain(secret);
  });

  it("同时脱敏一段文本中的多个敏感值", () => {
    const input = [
      "api_key=abcdefghijklmnop",
      "mysql://root:pass@localhost/app",
    ].join(" ");
    const masked = maskSensitiveText(input);

    expect(masked.match(/\[REDACTED\]/g)).toHaveLength(2);
    expect(masked).not.toContain("abcdefghijklmnop");
    expect(masked).not.toContain("root:pass");
  });

  it("重复调用得到相同结果", () => {
    const input = "secret=abcdefghijklmnop";
    expect(maskSensitiveText(input)).toBe(maskSensitiveText(input));
    expect(findSensitiveText(input)).toEqual(findSensitiveText(input));
  });
});
