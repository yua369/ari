import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { DirectionBadge, OutcomeBadge, VisibilityBadge } from "@/components/ui/Badge";
import { RestoreMemoryButton, PermanentlyDeleteButton } from "@/components/memory/MemoryWidgets";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 30;

// §27 MY CASES + Profile Menu（Account/Settings/Logout/Adminはここに集約）
export default async function MyPage({ searchParams }: PageProps<"/mypage">) {
  const user = await requireAuth("/mypage");
  const locale = await getLocale();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const showTrash = sp.trash === "1";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.MemoryWhereInput = {
    userId: user.id,
    deletedAt: showTrash ? { not: null } : null,
    ...(q ? { searchText: { contains: q } } : {}),
  };

  // §52 Pagination: Case大量時に全件一括Renderしない。
  const [total, memories] = await Promise.all([
    prisma.memory.count({ where }),
    prisma.memory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { select: { id: true, thumbnailFile: true, storyOrder: true, role: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <section className="surface p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold">@{user.username}</p>
          <p className="text-faint text-xs">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/patterns/candidates" className="btn !text-xs">
            {t(locale, "mypage.patternCandidates")}
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className="btn !text-xs">
              {t(locale, "nav.admin")}
            </Link>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-lg font-bold">
            {t(locale, "mypage.myCases")}（{total}）
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/mypage" className="btn !text-xs" style={!showTrash ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
              {t(locale, "mypage.normal")}
            </Link>
            <Link href="/mypage?trash=1" className="btn !text-xs" style={showTrash ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
              {t(locale, "mypage.trash")}
            </Link>
          </div>
        </div>
        <form action="/mypage" method="GET" className="flex gap-2 max-w-md">
          {showTrash && <input type="hidden" name="trash" value="1" />}
          <input name="q" defaultValue={q} placeholder={t(locale, "mypage.searchPlaceholder")} className="input" />
          <button type="submit" className="btn shrink-0">
            {t(locale, "common.search")}
          </button>
        </form>

        {memories.length === 0 ? (
          <div className="surface p-8 text-center text-dim text-sm">{showTrash ? t(locale, "mypage.emptyTrash") : t(locale, "mypage.empty")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memories.map((m) => {
              const entryImg = m.images.find((i) => i.role === "ENTRY") ?? m.images[0];
              return (
                <div key={m.id} className="surface flex flex-col overflow-hidden">
                  <Link href={showTrash ? "#" : `/memories/${m.id}`} className="relative aspect-video bg-black/40 overflow-hidden block">
                    {entryImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/images/${entryImg.id}/thumb`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-faint text-xs">{t(locale, "case.noImage")}</div>
                    )}
                  </Link>
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-faint mono">
                      <span>{m.symbol}</span>
                      <span>·</span>
                      <time>{m.occurredAt.toISOString().slice(0, 10)}</time>
                    </div>
                    <p className="text-sm font-semibold line-clamp-1">{m.patternName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <DirectionBadge value={m.direction} locale={locale} />
                      <OutcomeBadge value={m.outcome} locale={locale} />
                      <VisibilityBadge value={m.visibility} locale={locale} />
                    </div>
                    {showTrash ? (
                      <div className="flex gap-2 mt-1">
                        <RestoreMemoryButton memoryId={m.id} />
                        <PermanentlyDeleteButton memoryId={m.id} />
                      </div>
                    ) : (
                      <Link href={`/memories/${m.id}`} className="btn !text-xs !self-start mt-1">
                        {t(locale, "mypage.view")}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs">
            {page > 1 && (
              <Link className="btn !px-3 !py-1.5" href={pageHref({ q, showTrash, page: page - 1 })}>
                ← {locale === "en" ? "Prev" : "前へ"}
              </Link>
            )}
            <span className="text-faint">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link className="btn !px-3 !py-1.5" href={pageHref({ q, showTrash, page: page + 1 })}>
                {locale === "en" ? "Next" : "次へ"} →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function pageHref({ q, showTrash, page }: { q: string; showTrash: boolean; page: number }) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (showTrash) sp.set("trash", "1");
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/mypage?${qs}` : "/mypage";
}
