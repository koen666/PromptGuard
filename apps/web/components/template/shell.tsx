export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-neutral-950" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:36px_36px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.10),transparent_34%)]" />
      <div className="absolute inset-0 bg-neutral-950/20" />
    </div>
  );
}

export function TemplateShell() {
  return (
    <>
      <AmbientBackground />
    </>
  );
}

export function DividerPulse() {
  return null;
}

export function DividerSync({ label = "Sync" }: { label?: string }) {
  void label;
  return null;
}
