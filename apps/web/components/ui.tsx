"use client";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-emerald-300/15 bg-[linear-gradient(145deg,rgba(12,18,16,0.96),rgba(6,8,8,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.65),0_0_70px_rgba(16,185,129,0.08)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_15%,rgba(16,185,129,0.10),transparent_35%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:auto,28px_28px,28px_28px]" />
        <div className="relative mb-5 flex items-center justify-between">
          <h2 className="font-bricolage text-xl text-white">{title}</h2>
          <button onClick={onClose} className="rounded-full border border-white/10 px-2 py-0.5 text-white/45 hover:border-white/25 hover:bg-white/5 hover:text-white">
            ✕
          </button>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-emerald-400 text-neutral-950 hover:bg-emerald-300",
    secondary: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
    ghost: "text-white/60 hover:bg-white/5 hover:text-white",
    danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-white/30 bg-white/[0.07] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/45 transition focus:border-emerald-300/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-emerald-400/20 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-white/30 bg-white/[0.07] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/45 transition focus:border-emerald-300/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-emerald-400/20 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-white/30 bg-white/[0.07] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition focus:border-emerald-300/70 focus:bg-white/[0.10] focus:ring-2 focus:ring-emerald-400/20 ${className}`}
      {...props}
    />
  );
}
