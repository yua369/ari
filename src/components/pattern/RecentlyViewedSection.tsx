"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { patternName as pName } from "@/lib/pattern-types";
import { readRecentlyViewedPatterns, type RecentlyViewedPattern } from "@/lib/recentlyViewed";
import type { Locale } from "@/lib/i18n";

// §149 Recently Viewed: 直前に見ていたPatternへすぐ戻れる。日時は表示しない。Icon+Nameのみ。
export function RecentlyViewedSection({ title, locale }: { title: string; locale: Locale }) {
  const [patterns, setPatterns] = useState<RecentlyViewedPattern[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPatterns(readRecentlyViewedPatterns());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (patterns.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title">{title}</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
        {patterns.map((p) => {
          const icon = safeParseIcon(p.iconDefinition);
          const name = pName(p, locale);
          return (
            <Link
              key={p.id}
              href={`/patterns/${p.id}`}
              className="surface surface-hover p-2 flex flex-col gap-1 items-center shrink-0 transition-colors"
              style={{ width: 84 }}
            >
              <div className="w-12 h-12">{icon && <PatternIcon icon={icon} title={name} />}</div>
              <p className="text-[0.65rem] font-medium text-center leading-tight line-clamp-2">{name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
