import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { safeParse } from "@/lib/types";
import { MATURITY_LABEL, patternName as pName, patternDescription } from "@/lib/pattern-types";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { SavePatternButton } from "@/components/pattern/PatternWidgets";
import { RecentlyViewedTracker } from "@/components/pattern/RecentlyViewedTracker";

const TABS = ["ALL", "EXPECTED", "DIFFERENT", "INVALIDATED", "NO_TRADE"] as const;
const TAB_KEY = {
  ALL: "pattern.tabAll",
  EXPECTED: "pattern.tabExpected",
  DIFFERENT: "pattern.tabDifferent",
  INVALIDATED: "pattern.tabInvalidated",
  NO_TRADE: "pattern.tabNoTrade",
} as const;

export default async function PatternDetailPage({ params, searchParams }: PageProps<"/patterns/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && (TABS as readonly string[]).includes(sp.tab) ? sp.tab : "ALL";
  const [viewer, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const pattern = await prisma.pattern.findUnique({
    where: { id },
    include: {
      family: true,
      aliases: true,
      variants: { include: { _count: { select: { memories: true } } } },
      parentPattern: true,
      memories: {
        orderBy: { sequenceOrder: "asc" },
        include: { memory: { include: { images: { select: { id: true, thumbnailFile: true, storyOrder: true } }, user: { select: { username: true } } } } },
      },
    },
  });
  if (!pattern) notFound();

  const isSaved = viewer ? Boolean(await prisma.savedPattern.findUnique({ where: { userId_patternId: { userId: viewer.id, patternId: pattern.id } } })) : false;

  const visibleCases = pattern.memories.filter((mp) => {
    if (mp.memory.deletedAt) return false;
    if (mp.memory.visibility === "PUBLIC") return true;
    return viewer && (viewer.id === mp.memory.userId || viewer.isAdmin);
  });

  // §85 Development Terminology: Win/Loss軸ではなく、想定との一致度(EXPECTED/DIFFERENT/INVALIDATED/NO TRADE)で分類する。
  // ADD CASEの簡易フローではcaseType(EXAMPLE固定)は使われないため、実際のmemory.outcomeを使う。
  const outcomeTab = (outcome: string): (typeof TABS)[number] | null => {
    if (outcome === "WORKED") return "EXPECTED";
    if (outcome === "FAILED" || outcome === "BREAKEVEN") return "DIFFERENT";
    if (outcome === "INVALIDATED") return "INVALIDATED";
    if (outcome === "NO_TRADE") return "NO_TRADE";
    return null;
  };

  const counts = {
    ALL: visibleCases.length,
    EXPECTED: visibleCases.filter((c) => outcomeTab(c.memory.outcome) === "EXPECTED").length,
    DIFFERENT: visibleCases.filter((c) => outcomeTab(c.memory.outcome) === "DIFFERENT").length,
    INVALIDATED: visibleCases.filter((c) => outcomeTab(c.memory.outcome) === "INVALIDATED").length,
    NO_TRADE: visibleCases.filter((c) => outcomeTab(c.memory.outcome) === "NO_TRADE").length,
  };

  const filtered = tab === "ALL" ? visibleCases : visibleCases.filter((c) => outcomeTab(c.memory.outcome) === tab);
  const CASES_PAGE_SIZE = 60; // §52 Pagination: Case大量時に全件一括Renderしない
  const shown = filtered.slice(0, CASES_PAGE_SIZE);

  const icon = safeParseIcon(pattern.iconDefinition);
  const stateSequence = safeParse<string[]>(pattern.stateSequence, []);
  const name = pName(pattern, locale);
  const description = patternDescription(pattern, locale);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <RecentlyViewedTracker id={pattern.id} nameJa={pattern.nameJa} nameEn={pattern.nameEn} iconDefinition={pattern.iconDefinition} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 shrink-0 surface-2 p-3">{icon && <PatternIcon icon={icon} title={name} />}</div>
          <div>
            <div className="flex items-center gap-2 text-xs text-faint mono mb-1">
              {pattern.family && <span>{pattern.family.name}</span>}
              {pattern.parentPattern && (
                <>
                  <span>·</span>
                  <span>Variant of {pName(pattern.parentPattern, locale)}</span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold">{name}</h1>
            {pattern.aliases.length > 0 && <p className="text-faint text-xs mt-1">aka {pattern.aliases.map((a) => a.alias).join(" / ")}</p>}
            {description && <p className="text-dim text-sm mt-2 max-w-xl">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge">{MATURITY_LABEL[pattern.maturity]}</span>
          <SavePatternButton patternId={pattern.id} initialSaved={isSaved} viewerExists={Boolean(viewer)} labelSave={t(locale, "pattern.pinToQuick")} labelSaved={t(locale, "pattern.pinnedToQuick")} />
        </div>
      </div>

      {stateSequence.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{t(locale, "pattern.stateSequence")}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {stateSequence.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="surface-2 px-2.5 py-1 mono text-xs">{s}</span>
                {i < stateSequence.length - 1 && <span className="text-faint">→</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {TABS.map((tb) => (
            <Link
              key={tb}
              href={`/patterns/${pattern.id}?tab=${tb}`}
              className="btn !text-xs shrink-0"
              style={tab === tb ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            >
              {t(locale, TAB_KEY[tb])} ({counts[tb]})
            </Link>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="surface p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-dim text-sm">{t(locale, "pattern.noCasesInTab")}</p>
            {tab === "ALL" && (
              <Link href="/post" className="btn btn-primary !text-xs">
                {t(locale, "nav.addCase")}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shown.map((mp) => (
                <MemoryCard
                  key={mp.memoryId}
                  id={mp.memory.id}
                  title={mp.memory.title}
                  patternName={mp.memory.patternName}
                  summary={mp.notes || mp.memory.summary}
                  symbol={mp.memory.symbol}
                  occurredAt={mp.memory.occurredAt}
                  direction={mp.memory.direction}
                  outcome={mp.memory.outcome}
                  processQuality={mp.memory.processQuality}
                  visibility={mp.memory.visibility}
                  contributor={mp.memory.user.username}
                  thumbnailUrl={mp.memory.images.length > 0 ? `/api/images/${[...mp.memory.images].sort((a, b) => a.storyOrder - b.storyOrder)[0].id}/thumb` : null}
                  locale={locale}
                />
              ))}
            </div>
            {filtered.length > CASES_PAGE_SIZE && (
              <p className="text-faint text-xs text-center mt-1">
                {locale === "en"
                  ? `Showing ${CASES_PAGE_SIZE} of ${filtered.length} cases`
                  : `${filtered.length}件中 ${CASES_PAGE_SIZE}件を表示中`}
              </p>
            )}
          </>
        )}
      </section>

      {pattern.variants.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{t(locale, "pattern.variants")}</h2>
          <div className="flex flex-wrap gap-2">
            {pattern.variants.map((v) => (
              <Link key={v.id} href={`/patterns/${v.id}`} className="badge hover:border-[var(--accent)]">
                {pName(v, locale)} <span className="text-faint">×{v._count.memories}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
