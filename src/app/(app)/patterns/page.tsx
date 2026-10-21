import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { MATURITY_LABEL, patternName as pName } from "@/lib/pattern-types";
import { MemoryCard } from "@/components/memory/MemoryCard";
import type { Locale } from "@/lib/i18n";
import type { Prisma } from "@/generated/prisma/client";

export default async function PatternLibraryPage({ searchParams }: PageProps<"/patterns">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const [locale, viewer] = await Promise.all([getLocale(), getCurrentUser()]);

  // UNCLASSIFIEDは §45 により通常Patternと分離する(保留箱)
  const where: Prisma.PatternWhereInput = {
    slug: { not: "unclassified" },
    ...(q
      ? { OR: [{ nameJa: { contains: q } }, { nameEn: { contains: q } }, { aliases: { some: { alias: { contains: q } } } }] }
      : {}),
  };

  const [families, orphanPatterns, unclassified, matchingCases] = await Promise.all([
    prisma.patternFamily.findMany({
      include: {
        patterns: { where, include: { _count: { select: { memories: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.pattern.findMany({
      where: { ...where, familyId: null },
      include: { _count: { select: { memories: true } } },
      orderBy: { createdAt: "asc" },
    }),
    q ? Promise.resolve(null) : prisma.pattern.findUnique({ where: { slug: "unclassified" }, include: { _count: { select: { memories: true } } } }),
    // §26 Search結果: PATTERNSとCASESを分けて表示する
    q
      ? prisma.memory.findMany({
          where: {
            searchText: { contains: q },
            deletedAt: null,
            OR: [{ visibility: "PUBLIC" }, ...(viewer ? [{ userId: viewer.id }] : [])],
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: { images: { select: { id: true, thumbnailFile: true, storyOrder: true } }, user: { select: { username: true } } },
        })
      : Promise.resolve([]),
  ]);

  const totalPatterns = families.reduce((n, f) => n + f.patterns.length, 0) + orphanPatterns.length;
  const noResults = totalPatterns === 0 && matchingCases.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold">{t(locale, "pattern.library")}</h1>
          <p className="text-dim text-sm mt-1">
            {q ? `${totalPatterns}` : `${totalPatterns} ${t(locale, "pattern.allPatternsCount")}`}
          </p>
        </div>
        <Link href="/patterns/candidates/new" className="btn btn-primary !text-xs">
          {t(locale, "pattern.newPattern")}
        </Link>
      </div>

      <form action="/patterns" method="GET" className="flex gap-2 max-w-xl">
        <input name="q" defaultValue={q} placeholder={t(locale, "pattern.searchPlaceholder")} className="input" />
        <button type="submit" className="btn btn-primary shrink-0">
          {t(locale, "common.search")}
        </button>
      </form>

      {noResults ? (
        <div className="surface p-8 text-center text-dim text-sm">{t(locale, "pattern.noMatch")}</div>
      ) : (
        <>
          {q && totalPatterns > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">PATTERNS</h2>
              <PatternGrid patterns={[...families.flatMap((f) => f.patterns), ...orphanPatterns]} locale={locale} />
            </section>
          )}
          {q && matchingCases.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">CASES</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchingCases.map((m) => (
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
                    thumbnailUrl={
                      m.images.length > 0 ? `/api/images/${[...m.images].sort((a, b) => a.storyOrder - b.storyOrder)[0].id}/thumb` : null
                    }
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}
          {!q &&
            families
              .filter((f) => f.patterns.length > 0)
              .map((family) => (
                <section key={family.id} className="flex flex-col gap-3">
                  <h2 className="section-title">{family.name}</h2>
                  <PatternGrid patterns={family.patterns} locale={locale} />
                </section>
              ))}
          {!q && orphanPatterns.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">UNSORTED</h2>
              <PatternGrid patterns={orphanPatterns} locale={locale} />
            </section>
          )}
          {!q && unclassified && unclassified._count.memories > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">{t(locale, "home.unclassified")}</h2>
              <Link
                href={`/patterns/${unclassified.id}`}
                className="surface p-3 flex items-center gap-3 max-w-xs"
                style={{ opacity: 0.6 }}
              >
                <div className="w-10 h-10 shrink-0">
                  {safeParseIcon(unclassified.iconDefinition) && (
                    <PatternIcon icon={safeParseIcon(unclassified.iconDefinition)!} title={pName(unclassified, locale)} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{pName(unclassified, locale)}</p>
                  <p className="text-faint text-[0.7rem] mono">{unclassified._count.memories} {t(locale, "pattern.cases")}</p>
                </div>
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PatternGrid({
  patterns,
  locale,
}: {
  patterns: { id: string; nameJa: string; nameEn: string; descriptionJa: string | null; iconDefinition: string; maturity: string; _count: { memories: number } }[];
  locale: Locale;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {patterns.map((p) => {
        const icon = safeParseIcon(p.iconDefinition);
        const name = pName(p, locale);
        return (
          <Link key={p.id} href={`/patterns/${p.id}`} className="surface surface-hover p-3.5 flex flex-col gap-2 transition-colors">
            <div className="aspect-square w-full max-w-[96px] mx-auto">{icon && <PatternIcon icon={icon} title={name} className="w-full h-full" />}</div>
            <p className="text-sm font-semibold text-center leading-snug">{name}</p>
            <div className="flex items-center justify-center gap-2 text-[0.7rem] text-faint mono">
              <span>{p._count.memories} {t(locale, "pattern.cases")}</span>
              <span>·</span>
              <span>{MATURITY_LABEL[p.maturity]?.split(" ")[0] ?? p.maturity}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
