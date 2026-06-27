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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/78 p-4 backdrop-blur-xl">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#1d1e24]/96 p-6 shadow-[0_30px_110px_rgba(0,0,0,0.72),0_0_80px_rgba(112,103,255,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_15%,rgba(112,103,255,0.16),transparent_35%),radial-gradient(circle_at_80%_12%,rgba(255,105,205,0.10),transparent_30%)]" />
        <div className="relative mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-full border border-white/[0.10] px-2 py-0.5 text-white/45 hover:border-white/25 hover:bg-white/[0.06] hover:text-white">
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
    primary: "bg-[#7067ff] text-white shadow-[0_14px_30px_rgba(112,103,255,0.34)] hover:bg-[#8179ff]",
    secondary: "border border-white/[0.10] bg-white/[0.06] text-white hover:bg-white/[0.10]",
    ghost: "text-white/56 hover:bg-white/[0.06] hover:text-white",
    danger: "border border-[#ff6b92]/30 bg-[#ff6b92]/12 text-[#ff9fba] hover:bg-[#ff6b92]/18",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[16px] border border-white/[0.10] bg-[#15161b]/82 px-3.5 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-white/34 transition focus:border-[#7067ff]/75 focus:bg-[#1b1c22] focus:ring-2 focus:ring-[#7067ff]/20 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      wrap="soft"
      className={`min-w-0 max-w-full resize-y overflow-x-hidden whitespace-pre-wrap break-words w-full rounded-[18px] border border-white/[0.10] bg-[#15161b]/82 px-3.5 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-white/34 transition focus:border-[#7067ff]/75 focus:bg-[#1b1c22] focus:ring-2 focus:ring-[#7067ff]/20 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[16px] border border-white/[0.10] bg-[#15161b]/82 px-3.5 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[#7067ff]/75 focus:bg-[#1b1c22] focus:ring-2 focus:ring-[#7067ff]/20 ${className}`}
      {...props}
    />
  );
}
