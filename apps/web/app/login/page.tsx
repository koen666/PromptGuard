import { Suspense } from "react";
import { TemplatePageWrap, TemplateSectionHeader } from "@/components/template/sections";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
      <TemplatePageWrap>
        <TemplateSectionHeader tag="Auth" title="Login" titleMuted="权限" />
        <Suspense>
          <LoginForm />
        </Suspense>
      </TemplatePageWrap>
  );
}
