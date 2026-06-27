export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#17181d]" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(112,103,255,0.18),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(255,105,205,0.12),transparent_30%),radial-gradient(circle_at_66%_82%,rgba(69,224,142,0.10),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0.18)_0%,rgba(12,13,17,0.72)_56%,rgba(12,13,17,0.92)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[292px] border-r border-white/[0.06] bg-[#1d1e24]/88 shadow-[18px_0_70px_rgba(0,0,0,0.30)]" />
    </div>
  );
}

export function TemplateShell() {
  return <AmbientBackground />;
}

export function DividerPulse() {
  return null;
}

export function DividerSync({ label = "Sync" }: { label?: string }) {
  void label;
  return null;
}
