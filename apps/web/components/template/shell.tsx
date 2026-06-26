export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#0f1112]" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(232,224,190,0.08)_0%,rgba(15,17,18,0)_24%,rgba(15,17,18,0.74)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-16 border-b border-white/[0.08] bg-[#171a1b]/80" />
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
