"use client";

import { useState } from "react";
import { getAnalysisPrompt } from "@/lib/prompts";
import type { Locale } from "@/lib/i18n";

// サイト内部では分析しない。Promptをコピーして、ユーザー自身がChatGPTへ送る。
export function CopyPromptButton({ locale, label, copiedLabel }: { locale: Locale; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = getAnalysisPrompt(locale);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className="btn btn-primary !text-xs">
      {copied ? copiedLabel : label}
    </button>
  );
}
