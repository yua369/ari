import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { t, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { patternName as pName } from "@/lib/pattern-types";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { RecentlyViewedSection } from "@/components/pattern/RecentlyViewedSection";

// §33-36 Logged-in Home: Landing PageではなくResearch Dashboard。Heroは不要、Searchを先頭に。
// 優先順位: Global Search → Quick Patterns → Recently Viewed → Community Cases → My Recent Cases
export default async function HomePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const [popularPatterns, recentMemories, savedPatternIds, myRecentMemories] = await Promise.all([
    // §45 UNCLASSIFIEDは通常Patternのグリッドに混ぜない(保留箱として扱う)
    prisma.pattern.findMany({
      where: { slug: { not: "unclassified" } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include: { _count: { select: { memories: true } } },
    }),
    prisma.memory.findMany({
      where: { visibility: "PUBLIC", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        images: { select: { id: true, thumbnailFile: true, storyOrder: true } },
        user: { select: { username: true } },
      },
    }),
    prisma.savedPattern.findMany({ where: { userId: user.id }, select: { patternId: true } }),
    // §35 My Recent Cases: Communityより自分の行動を優先する
    prisma.memory.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        images: { select: { id: true, thumbnailFile: true, storyOrder: true } },
        user: { select: { username: true } },
      },
    }),
  ]);

  const quickPatternIds = new Set(savedPatternIds.map((s) => s.patternId));
  const myQuickPatterns = popularPatterns.filter((p) => quickPatternIds.has(p.id));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <form action="/patterns" method="GET" className="flex gap-2 max-w-xl">
          <input name="q" placeholder={t(locale, "home.searchPlaceholder")} className="input" />
          <button type="submit" className="btn btn-primary shrink-0">
            {t(locale, "home.searchButton")}
          </button>
        </form>
      </section>

      {user && myQuickPatterns.length > 0 && (
        <PatternSection title={t(locale, "home.myQuickPatterns")} patterns={myQuickPatterns} locale={locale} />
      )}

      {user && <RecentlyViewedSection title={t(locale, "home.recentlyViewed")} locale={locale} />}

      {popularPatterns.length > 0 ? (
        <PatternSection title={t(locale, "home.popularPatterns")} patterns={popularPatterns} viewAllHref="/patterns" locale={locale} viewAllLabel={t(locale, "home.viewAll")} />
      ) : (
        <div className="surface p-8 text-center text-dim text-sm">{t(locale, "home.noPatterns")}</div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="section-title">{t(locale, "home.recentCases")}</h2>
        {recentMemories.length === 0 ? (
          <div className="surface p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-dim text-sm">{t(locale, "home.noPublicCases")}</p>
            <p className="text-faint text-xs">{t(locale, "home.noPublicCasesCta")}</p>
            <Link href="/post" className="btn btn-primary !text-xs">
              {t(locale, "home.recordFirstCase")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentMemories.map((m) => (
              <MemoryCard
                key={m.id}
                id={m.id}
                title={m.title}
                patternName={m.patternName}
                summary={m.summary}
                symbol={m.symbol}
                occurredAt={m.occurredAt}
                direction={m.direction}
                outcome={m.outcome}
                processQuality={m.processQuality}
                visibility={m.visibility}
                contributor={m.user.username}
                thumbnailUrl={thumbUrl(m.images)}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>

      {user && myRecentMemories.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{t(locale, "home.myRecentCases")}</h2>
            <Link href="/mypage" className="text-xs text-faint hover:text-[var(--text)]">
              {t(locale, "home.viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myRecentMemories.map((m) => (
              <MemoryCard
                key={m.id}
                id={m.id}
                title={m.title}
                patternName={m.patternName}
                summary={m.summary}
                symbol={m.symbol}
                occurredAt={m.occurredAt}
                direction={m.direction}
                outcome={m.outcome}
                processQuality={m.processQuality}
                visibility={m.visibility}
                contributor={m.user.username}
                thumbnailUrl={thumbUrl(m.images)}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function thumbUrl(images: { id: string; thumbnailFile: string | null; storyOrder: number }[]) {
  if (images.length === 0) return null;
  const first = [...images].sort((a, b) => a.storyOrder - b.storyOrder)[0];
  return `/api/images/${first.id}/thumb`;
}

function PatternSection({
  title,
  patterns,
  viewAllHref,
  viewAllLabel,
  locale,
}: {
  title: string;
  patterns: { id: string; nameJa: string; nameEn: string; iconDefinition: string; _count: { memories: number } }[];
  viewAllHref?: string;
  viewAllLabel?: string;
  locale: Locale;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs text-faint hover:text-[var(--text)]">
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {patterns.map((p) => {
          const icon = safeParseIcon(p.iconDefinition);
          const name = pName(p, locale);
          return (
            <Link
              key={p.id}
              href={`/patterns/${p.id}`}
              className="surface surface-hover p-2.5 flex flex-col gap-1.5 transition-colors"
            >
              <div className="aspect-square w-full">{icon && <PatternIcon icon={icon} title={name} />}</div>
              <p className="text-[0.7rem] font-semibold text-center leading-tight line-clamp-2">{name}</p>
              <p className="text-faint text-[0.6rem] text-center mono">{p._count.memories} CASES</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
