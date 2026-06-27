import type { Metadata } from "next";
import Script from "next/script";
import { AppFrame } from "@/components/app-frame";
import { TemplateShell } from "@/components/template/shell";
import { loadEnv } from "@/lib/env";
import "./globals.css";

loadEnv();

export const metadata: Metadata = {
  title: "PromptGuard",
  description: "提示词核心资产保护库",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className="relative w-full overflow-x-hidden bg-[#17181d] text-neutral-50 selection:bg-[#7067ff]/35 selection:text-white">
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="afterInteractive" />
        <TemplateShell />
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
