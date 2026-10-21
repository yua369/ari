"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n";

export function LoginForm({ locale, next }: { locale: Locale; next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const en = locale === "en";

  return (
    <form action={action} className="flex flex-col gap-3 w-full">
      <input type="hidden" name="next" value={next ?? "/"} />
      <div>
        <label className="field-label block mb-1.5" htmlFor="emailOrUsername">
          {en ? "Email or Username" : "メールアドレス または ユーザー名"}
        </label>
        <input id="emailOrUsername" name="emailOrUsername" type="text" autoFocus className="input" />
      </div>
      <div>
        <label className="field-label block mb-1.5" htmlFor="password">
          {en ? "Password" : "パスワード"}
        </label>
        <input id="password" name="password" type="password" className="input" placeholder="••••••••" />
      </div>
      {state?.error && (
        <p className="text-xs" style={{ color: "var(--tag-amber)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? (en ? "Checking..." : "確認中...") : en ? "Log in" : "ログイン"}
      </button>
    </form>
  );
}
