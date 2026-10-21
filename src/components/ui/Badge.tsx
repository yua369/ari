import { t, type Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

const DIRECTION_COLOR: Record<string, string> = {
  LONG: "var(--tag-blue)",
  SHORT: "var(--tag-violet)",
  WAIT: "var(--tag-gray)",
  MIXED: "var(--tag-amber)",
};

// §14 Color Semantics: Green=想定通りの展開 / Red=無効化・想定と異なる展開 / Gray=中立
const OUTCOME_COLOR: Record<string, string> = {
  WORKED: "var(--tag-teal)",
  FAILED: "var(--tag-red)",
  BREAKEVEN: "var(--tag-gray)",
  NO_TRADE: "var(--tag-gray)",
  INVALIDATED: "var(--tag-red)",
  PARTIAL: "var(--tag-amber)",
  UNKNOWN: "var(--tag-gray)",
};

const PROCESS_QUALITY_COLOR: Record<string, string> = {
  EXCELLENT: "var(--tag-teal)",
  GOOD: "var(--tag-blue)",
  NEUTRAL: "var(--tag-gray)",
  POOR: "var(--tag-amber)",
  UNRATED: "var(--tag-gray)",
};

export function Dot({ color }: { color: string }) {
  return <span className="badge-dot" style={{ background: color }} />;
}

export function DirectionBadge({ value, locale = "ja" }: { value: string; locale?: Locale }) {
  const key = `direction.${value}` as TranslationKey;
  return (
    <span className="badge">
      <Dot color={DIRECTION_COLOR[value] ?? "var(--tag-gray)"} />
      {t(locale, key)}
    </span>
  );
}

export function OutcomeBadge({ value, locale = "ja" }: { value: string; locale?: Locale }) {
  const key = `result.${value}` as TranslationKey;
  return (
    <span className="badge">
      <Dot color={OUTCOME_COLOR[value] ?? "var(--tag-gray)"} />
      {t(locale, key)}
    </span>
  );
}

export function ProcessQualityBadge({ value }: { value: string }) {
  if (value === "UNRATED") {
    return (
      <span className="badge" style={{ opacity: 0.5 }}>
        PROCESS: —
      </span>
    );
  }
  return (
    <span className="badge">
      <Dot color={PROCESS_QUALITY_COLOR[value] ?? "var(--tag-gray)"} />
      PROCESS: {value}
    </span>
  );
}

export function VisibilityBadge({ value, locale = "ja" }: { value: string; locale?: Locale }) {
  return (
    <span className="badge" style={value === "PUBLIC" ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
      {value === "PUBLIC" ? t(locale, "case.public") : t(locale, "case.private")}
    </span>
  );
}

export function ImageRoleBadge({ value }: { value: string }) {
  return <span className="badge !text-[0.65rem] !py-[0.1rem]">{value}</span>;
}

export function ProBadge() {
  return (
    <span className="badge" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
      PRO
    </span>
  );
}
