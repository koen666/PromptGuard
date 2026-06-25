"use client";

import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import { FieldLabel, Panel } from "@/components/template/sections";

interface VersionItem {
  versionNumber: number;
}

export function DiffVersionPicker({
  promptId,
  versions,
  from,
  to,
}: {
  promptId: string;
  versions: VersionItem[];
  from: number;
  to: number;
}) {
  const router = useRouter();

  function navigate(nextFrom: number, nextTo: number) {
    router.push(`/prompts/${promptId}/diff?from=${nextFrom}&to=${nextTo}`);
  }

  return (
    <Panel className="mb-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <FieldLabel>基准版本</FieldLabel>
          <Select value={from} onChange={(event) => navigate(Number(event.target.value), to)}>
            {versions.map((version) => (
              <option key={version.versionNumber} value={version.versionNumber}>
                v{version.versionNumber}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>目标版本</FieldLabel>
          <Select value={to} onChange={(event) => navigate(from, Number(event.target.value))}>
            {versions.map((version) => (
              <option key={version.versionNumber} value={version.versionNumber}>
                v{version.versionNumber}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="secondary"
          disabled={from === to}
          onClick={() => navigate(Math.min(from, to), Math.max(from, to))}
        >
          正序对比
        </Button>
      </div>
      {from === to && <p className="mt-3 text-sm text-amber-200">请选择两个不同版本查看差异。</p>}
    </Panel>
  );
}
