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
    "filter-btn flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 shadow-lg shadow-white/5 transition-all duration-300";
  const btnIdle =
    "filter-btn flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white/50 transition-all duration-300 hover:bg-white/5 hover:text-white";

  return (
    <div className="animate-on-scroll relative group delay-100">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 opacity-0 blur transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-center rounded-full border border-white/10 bg-neutral-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
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
