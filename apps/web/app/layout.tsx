import type { Metadata } from "next";
import Script from "next/script";
import { TemplateNav } from "@/components/template/nav";
import { TemplateScrollReveal } from "@/components/template/scroll-reveal";
import { TemplateShell } from "@/components/template/shell";
import { loadEnv } from "@/lib/env";
import "./globals.css";

loadEnv();

export const metadata: Metadata = {
  title: "PromptGuard",
  description: "Prompt 核心资产保护库",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className="relative w-full overflow-x-hidden bg-neutral-950 text-neutral-50 selection:bg-white/20 selection:text-white">
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="afterInteractive" />
        <TemplateShell />
        <TemplateNav />
        <TemplateScrollReveal />
        <div className="relative z-10 min-h-screen px-3 pb-3 pt-[72px] md:pl-[92px]">
          {children}
        </div>
      </body>
    </html>
  );
}
