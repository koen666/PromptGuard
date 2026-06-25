export type SensitiveRiskLevel = "low" | "medium" | "high" | "critical";

export interface SensitiveMatch {
  name: string;
  riskLevel: SensitiveRiskLevel;
  description: string;
  evidence: string;
}

const SENSITIVE_RULES: Array<{
  name: string;
  riskLevel: SensitiveRiskLevel;
  description: string;
  pattern: RegExp;
}> = [
  {
    name: "OpenAI API Key",
    riskLevel: "critical",
    description: "Prompt contains a value that looks like an OpenAI API key.",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "Generic API Key",
    riskLevel: "high",
    description: "Prompt contains a field that looks like an API key or secret.",
    pattern: /\b(api[_-]?key|secret|token|access[_-]?token)\s*[:=]\s*["']?([A-Za-z0-9_\-./+=]{12,})["']?/gi,
  },
  {
    name: "Database Connection String",
    riskLevel: "high",
    description: "Prompt contains a database connection string.",
    pattern: /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/|redis:\/\/)[^\s"'`]+/gi,
  },
  {
    name: "AWS Access Key",
    riskLevel: "critical",
    description: "Prompt contains a value that looks like an AWS access key.",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "Private Key Block",
    riskLevel: "critical",
    description: "Prompt contains a private key block.",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    name: "Internal Account",
    riskLevel: "medium",
    description: "Prompt appears to contain an internal account or credential label.",
    pattern: /\b(admin|root|internal[_-]?user|service[_-]?account)\s*[:=]\s*["']?[A-Za-z0-9_.@-]{3,}["']?/gi,
  },
  {
    name: "Stack Trace",
    riskLevel: "medium",
    description: "Text contains stack trace details that should be hidden in reports.",
    pattern: /\b(at\s+[\w.$<>]+\s+\([^)]+:\d+:\d+\)|Traceback \(most recent call last\):)/g,
  },
];

export function maskSensitiveText(text: string) {
  let masked = text;
  for (const rule of SENSITIVE_RULES) {
    masked = masked.replace(rule.pattern, (match) => maskValue(match));
  }
  return masked;
}

export function findSensitiveText(text: string): SensitiveMatch[] {
  const findings: SensitiveMatch[] = [];
  for (const rule of SENSITIVE_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      findings.push({
        name: rule.name,
        riskLevel: rule.riskLevel,
        description: rule.description,
        evidence: maskSensitiveText(match[0]).slice(0, 240),
      });
    }
  }
  return findings;
}

function maskValue(value: string) {
  if (value.length <= 8) return "[REDACTED]";
  const prefix = value.slice(0, Math.min(4, value.length));
  const suffix = value.slice(-4);
  return `${prefix}[REDACTED]${suffix}`;
}
