export const PATTERN_FAMILY_SUGGESTIONS = [
  "LEVEL REACTION",
  "BREAKOUT",
  "FAILED BREAKOUT",
  "REVERSAL",
  "TREND CONTINUATION",
  "STRUCTURE SHIFT",
  "RANGE",
  "RETEST",
  "REBREAK",
  "FAILED CONTINUATION",
  "LIQUIDITY / SWEEP",
];

export const CASE_TYPE_LABEL: Record<string, string> = {
  EXAMPLE: "EXAMPLE",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  INVALIDATED: "INVALIDATED",
  COUNTEREXAMPLE: "COUNTEREXAMPLE",
  REFERENCE: "REFERENCE",
};

export const CASE_TYPE_COLOR: Record<string, string> = {
  EXAMPLE: "var(--tag-gray)",
  SUCCESS: "var(--tag-blue)",
  FAILURE: "var(--tag-amber)",
  INVALIDATED: "var(--tag-violet)",
  COUNTEREXAMPLE: "var(--tag-teal)",
  REFERENCE: "var(--tag-gray)",
};

export const MATURITY_LABEL: Record<string, string> = {
  OBSERVED: "OBSERVED — 1件程度",
  REPEATED: "REPEATED — 複数回確認",
  RECURRING: "RECURRING — 継続して出現",
  CORE_PATTERN: "CORE PATTERN — 重要Patternとして認定",
};

import type { Locale } from "@/lib/i18n";

// Patternのnameは言語非依存のslugで管理し、表示だけname_ja/name_enを切り替える。
export function patternName(p: { nameJa: string; nameEn: string }, locale: Locale): string {
  return locale === "en" ? p.nameEn || p.nameJa : p.nameJa;
}

export function patternDescription(p: { descriptionJa: string | null; descriptionEn?: string | null }, locale: Locale): string {
  if (locale === "en") return p.descriptionEn || p.descriptionJa || "";
  return p.descriptionJa || "";
}

export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || `pattern-${Date.now()}`
  );
}
