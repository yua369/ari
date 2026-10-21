"use client";

import { useActionState } from "react";
import { signupAction } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n";

export function SignupForm({ locale, next }: { locale: Locale; next?: string }) {
  const [state, action, pending] = useActionState(signupAction, undefined);
  const en = locale === "en";

  return (
    <form action={action} className="flex flex-col gap-3 w-full">
      <input type="hidden" name="next" value={next ?? "/"} />
      <div>
        <label className="field-label block mb-1.5" htmlFor="username">
          {en ? "Username (letters, numbers, underscore, 3-20 chars)" : "ユーザー名（英数字・アンダースコア、3〜20文字）"}
        </label>
        <input id="username" name="username" type="text" autoFocus className="input" required pattern="[a-zA-Z0-9_]{3,20}" />
      </div>
      <div>
        <label className="field-label block mb-1.5" htmlFor="email">
          {en ? "Email" : "メールアドレス"}
        </label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="field-label block mb-1.5" htmlFor="password">
          {en ? "Password (8+ characters)" : "パスワード（8文字以上）"}
        </label>
        <input id="password" name="password" type="password" className="input" required minLength={8} />
      </div>
      {state?.error && (
        <p className="text-xs" style={{ color: "var(--tag-amber)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? (en ? "Creating..." : "作成中...") : en ? "Sign up" : "新規登録"}
      </button>
      <p className="text-faint text-[0.65rem] mt-1">
        {en ? "Google sign-in is coming soon (email only for now)." : "Google等の外部ログインは準備中です（Email登録のみ対応）。"}
      </p>
    </form>
  );
}
