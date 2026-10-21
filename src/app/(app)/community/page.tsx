import Link from "next/link";
import { prisma } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { MemoryCard } from "@/components/memory/MemoryCard";

const PAGE_SIZE = 24;

// §26-28/§90 Community: SNSではなくShared Trading Research Library。Ranking/DM/Signalは置かない。
export default async function CommunityPage({ searchParams }: PageProps<"/community">) {
  const locale = await getLocale();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = { visibility: "PUBLIC" as const, deletedAt: null };
  const [total, memories] = await Promise.all([
    prisma.memory.count({ where }),
    prisma.memory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { select: { id: true, thumbnailFile: true, storyOrder: true } }, user: { select: { username: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">{t(locale, "community.title")}</h1>
        <p className="text-dim text-sm mt-1">{t(locale, "community.subtitle")}</p>
      </div>

      {memories.length === 0 ? (
        <div className="surface p-8 text-center text-dim text-sm">{t(locale, "community.empty")}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memories.map((m) => (
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-xs">
              {page > 1 && (
                <Link href={`/community?page=${page - 1}`} className="btn !text-xs">
                  ← Prev
                </Link>
              )}
              <span className="text-faint">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/community?page=${page + 1}`} className="btn !text-xs">
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
