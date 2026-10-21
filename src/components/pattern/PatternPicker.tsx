"use client";

import { useEffect, useMemo, useState } from "react";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { patternName as pName } from "@/lib/pattern-types";
import { t, type Locale } from "@/lib/i18n";

type PatternLite = { id: string; nameJa: string; nameEn: string; iconDefinition: string; aliases: string[] };

export type PatternPickerValue = {
  patternId: string | null;
  newCandidateName: string;
  newCandidateDescription: string;
};

// §22-24 Pattern選択はIcon Gridで。「まだ分からない」と「新しいPattern候補」を必ず用意する。
// §23 Patternが増えても検索で絞り込めるようにする。
export function PatternPicker({
  value,
  onChange,
  locale,
}: {
  value: PatternPickerValue;
  onChange: (v: PatternPickerValue) => void;
  locale: Locale;
}) {
  const [patterns, setPatterns] = useState<PatternLite[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/patterns/list-icons")
      .then((r) => r.json())
      .then((data) => setPatterns(data.patterns ?? []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patterns;
    return patterns.filter(
      (p) =>
        p.nameJa.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [patterns, query]);

  const selectedPattern = patterns.find((p) => p.id === value.patternId);

  function selectPattern(id: string) {
    setShowNewForm(false);
    onChange({ patternId: id, newCandidateName: "", newCandidateDescription: "" });
  }

  function selectUnclassified() {
    setShowNewForm(false);
    onChange({ patternId: null, newCandidateName: "", newCandidateDescription: "" });
  }

  return (
    <div className="flex flex-col gap-3">
      {patterns.length > 8 && (
        <input
          className="input !text-xs max-w-xs"
          placeholder={t(locale, "pattern.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {selectedPattern && (
        <p className="text-xs text-dim">
          {t(locale, "pattern.selected")}: <span className="font-semibold text-[var(--text)]">{pName(selectedPattern, locale)}</span>
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-faint text-xs">{t(locale, "pattern.noMatch")}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {filtered.map((p) => {
            const icon = safeParseIcon(p.iconDefinition);
            const selected = value.patternId === p.id;
            const name = pName(p, locale);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                onClick={() => selectPattern(p.id)}
                className="surface-2 p-2 flex flex-col gap-1 items-center"
                style={selected ? { borderColor: "var(--accent)", borderWidth: 2, boxShadow: "0 0 0 1px var(--accent)" } : undefined}
              >
                <div className="w-12 h-12">{icon && <PatternIcon icon={icon} title={name} />}</div>
                <p className="text-[0.65rem] text-center leading-tight line-clamp-2">{name}</p>
                {selected && <span className="text-[0.6rem]" style={{ color: "var(--accent)" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="btn !text-xs"
          onClick={selectUnclassified}
          style={!value.patternId && !showNewForm ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
        >
          {t(locale, "case.unclassified")}
        </button>
        <button
          type="button"
          className="btn !text-xs"
          onClick={() => {
            setShowNewForm(true);
            onChange({ patternId: null, newCandidateName: value.newCandidateName, newCandidateDescription: value.newCandidateDescription });
          }}
          style={showNewForm ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
        >
          {t(locale, "case.newCandidate")}
        </button>
      </div>

      {showNewForm && (
        <div className="surface-2 p-3 flex flex-col gap-2">
          <input
            className="input !text-xs"
            placeholder={t(locale, "case.newCandidateName")}
            value={value.newCandidateName}
            onChange={(e) => onChange({ ...value, newCandidateName: e.target.value })}
          />
          <input
            className="input !text-xs"
            placeholder={t(locale, "case.newCandidateDesc")}
            value={value.newCandidateDescription}
            onChange={(e) => onChange({ ...value, newCandidateDescription: e.target.value })}
          />
          <p className="text-faint text-[0.65rem]">{t(locale, "case.newCandidateNote")}</p>
        </div>
      )}
    </div>
  );
}
