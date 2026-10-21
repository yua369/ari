"use client";

import { useState } from "react";
import Link from "next/link";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { patternName as pName, patternDescription, CASE_TYPE_LABEL } from "@/lib/pattern-types";
import type { Locale } from "@/lib/i18n";

type PinnedPattern = {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string | null;
  descriptionEn: string | null;
  iconDefinition: string;
  _count: { memories: number };
  memories: {
    caseType: string;
    memory: { id: string; title: string; patternName: string; occurredAt: Date; symbol: string };
  }[];
};

// §37(fx-analysis-memoryより移植) Quick Recall: エントリー前に数秒で過去経験を確認する実戦モード。Research(Pattern Library)とは分離。
export function QuickRecallGrid({
  pinned,
  locale,
  emptyLabel,
  emptyCta,
  noCasesLabel,
  viewAllLabel,
}: {
  pinned: PinnedPattern[];
  locale: Locale;
  emptyLabel: string;
  emptyCta: string;
  noCasesLabel: string;
  viewAllLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (pinned.length === 0) {
    return (
      <div className="surface p-8 text-center text-dim text-sm flex flex-col gap-3 items-center">
        <p>{emptyLabel}</p>
        <Link href="/patterns" className="btn btn-primary !text-xs">
          {emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {pinned.map((p) => {
        const icon = safeParseIcon(p.iconDefinition);
        const name = pName(p, locale);
        const description = patternDescription(p, locale);
        const isOpen = openId === p.id;
        return (
          <div key={p.id} className="surface flex flex-col overflow-hidden">
            <button
              type="button"
              className="p-3.5 flex flex-col gap-2 items-stretch text-left"
              onClick={() => setOpenId(isOpen ? null : p.id)}
            >
              <div className="aspect-square w-full max-w-[88px] mx-auto">
                {icon && <PatternIcon icon={icon} title={name} className="w-full h-full" />}
              </div>
              <p className="text-sm font-semibold text-center leading-snug">{name}</p>
              <p className="text-faint text-xs text-center mono">{p._count.memories} CASES</p>
            </button>
            {isOpen && (
              <div className="border-t p-3 flex flex-col gap-2 text-xs" style={{ borderColor: "var(--border)" }}>
                {description && <p className="text-dim">{description}</p>}
                {p.memories.length === 0 ? (
                  <p className="text-faint">{noCasesLabel}</p>
                ) : (
                  p.memories.map((mp) => (
                    <Link
                      key={mp.memory.id}
                      href={`/memories/${mp.memory.id}`}
                      className="surface-2 surface-hover px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate">{mp.memory.patternName}</span>
                      <span className="badge shrink-0 !text-[0.65rem]">{CASE_TYPE_LABEL[mp.caseType] ?? mp.caseType}</span>
                    </Link>
                  ))
                )}
                <Link href={`/patterns/${p.id}`} className="btn !text-xs !self-stretch justify-center mt-1">
                  {viewAllLabel}
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
