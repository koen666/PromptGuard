"use client";

import { useState } from "react";

const filters = [
  { id: "all", label: "All Missions" },
  { id: "prompt", label: "Prompt" },
  { id: "eval", label: "Eval" },
] as const;

export function TemplateMissionFilter({ onChange }: { onChange?: (id: string) => void }) {
  const [active, setActive] = useState("all");

  const btnActive =
    "filter-btn flex items-center gap-2 rounded-[16px] bg-[#7067ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(112,103,255,0.35)] transition-all duration-300";
  const btnIdle =
    "filter-btn flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-medium text-white/50 transition-all duration-300 hover:bg-white/[0.06] hover:text-white";

  return (
    <div className="animate-on-scroll relative group delay-100">
      <div className="absolute -inset-1 rounded-[22px] bg-[#7067ff]/18 opacity-0 blur transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-center rounded-[22px] border border-white/[0.08] bg-[#1d1e24]/92 p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={active === f.id ? btnActive : btnIdle}
            onClick={() => {
              setActive(f.id);
              onChange?.(f.id);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type MissionFilterId = (typeof filters)[number]["id"];
