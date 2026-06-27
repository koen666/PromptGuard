import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#62d7ff] to-[#7067ff] text-base font-bold text-white shadow-[0_18px_40px_rgba(112,103,255,0.28)]">
            PG
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">PromptGuard</h1>
          <p className="mt-2 text-sm text-white/42">提示词核心资产保护平台</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
