import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { patternName as pName } from "@/lib/pattern-types";
import { MemoryCard } from "@/components/memory/MemoryCard";

// §150-151 SAVED: Saved Patterns / Saved Cases のみ。複雑にしない。
export default async function SavedPage() {
  const user = await requireAuth("/saved");
  const locale = await getLocale();

  const [savedPatterns, savedMemories] = await Promise.all([
    prisma.savedPattern.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { pattern: { include: { _count: { select: { memories: true } } } } },
    }),
    prisma.savedMemory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        memory: {
          include: {
            images: { select: { id: true, thumbnailFile: true, storyOrder: true } },
            user: { select: { username: true } },
          },
        },
      },
    }),
  ]);

  // §152 Case Count: 削除済み・閲覧不可（他人のPRIVATE）は除外する
  const visibleSavedMemories = savedMemories.filter(
    (s) => !s.memory.deletedAt && (s.memory.visibility === "PUBLIC" || s.memory.userId === user.id)
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      <h1 className="text-lg font-bold">{t(locale, "saved.title")}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">{t(locale, "saved.patterns")}</h2>
        {savedPatterns.length === 0 ? (
          <div className="surface p-6 text-center text-dim text-sm">{t(locale, "saved.noPatterns")}</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {savedPatterns.map((s) => {
              const icon = safeParseIcon(s.pattern.iconDefinition);
              const name = pName(s.pattern, locale);
              return (
                <Link
                  key={s.patternId}
                  href={`/patterns/${s.patternId}`}
                  className="surface surface-hover p-2.5 flex flex-col gap-1.5 transition-colors"
                >
                  <div className="aspect-square w-full">{icon && <PatternIcon icon={icon} title={name} />}</div>
                  <p className="text-[0.7rem] font-semibold text-center leading-tight line-clamp-2">{name}</p>
                  <p className="text-faint text-[0.6rem] text-center mono">{s.pattern._count.memories} CASES</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">{t(locale, "saved.cases")}</h2>
        {visibleSavedMemories.length === 0 ? (
          <div className="surface p-6 text-center text-dim text-sm">{t(locale, "saved.noCases")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleSavedMemories.map((s) => (
              <MemoryCard
                key={s.memoryId}
                id={s.memory.id}
                title={s.memory.title}
                patternName={s.memory.patternName}
                summary={s.memory.summary}
                symbol={s.memory.symbol}
                occurredAt={s.memory.occurredAt}
                direction={s.memory.direction}
                outcome={s.memory.outcome}
                processQuality={s.memory.processQuality}
                visibility={s.memory.visibility}
                contributor={s.memory.user.username}
                thumbnailUrl={
                  s.memory.images.length > 0
                    ? `/api/images/${[...s.memory.images].sort((a, b) => a.storyOrder - b.storyOrder)[0].id}/thumb`
                    : null
                }
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
