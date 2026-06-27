export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#17181d]" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(126deg,#22232b_0%,#1a1b21_34%,#15161b_66%,#111218_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(112,103,255,0.20),transparent_34%),radial-gradient(circle_at_76%_12%,rgba(255,105,205,0.12),transparent_31%),radial-gradient(circle_at_54%_90%,rgba(69,224,142,0.10),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0.12)_0%,rgba(12,13,17,0.56)_58%,rgba(12,13,17,0.88)_100%)]" />
      <div className="absolute inset-y-0 left-0 right-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.055),transparent_42%)]" />
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
