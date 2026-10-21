"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n";

// ヘッダー右上の言語切替。page reloadなしで(router.refresh=RSCの再取得のみ)切り替える。
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 shrink-0 text-xs mono">
      <button
        type="button"
        onClick={() => switchTo("ja")}
        className="px-1.5 py-1 rounded"
        style={{ color: locale === "ja" ? "var(--text)" : "var(--text-faint)", fontWeight: locale === "ja" ? 700 : 400 }}
      >
        日本語
      </button>
      <span className="text-faint">|</span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className="px-1.5 py-1 rounded"
        style={{ color: locale === "en" ? "var(--text)" : "var(--text-faint)", fontWeight: locale === "en" ? 700 : 400 }}
      >
        English
      </button>
    </div>
  );
}
