import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { QuickRecallGrid } from "@/components/pattern/QuickRecallGrid";

// §37(fx-analysis-memoryより移植) Quick Recall: 「これ前にも見た気がする」と思った時、数秒で過去Caseを呼び出す実戦画面。
export default async function QuickRecallPage() {
  const user = await requireAuth("/quick");
  const locale = await getLocale();

  const saved = await prisma.savedPattern.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      pattern: {
        include: {
          memories: {
            where: { memory: { userId: user.id, deletedAt: null } },
            orderBy: { memory: { createdAt: "desc" } },
            take: 3,
            include: {
              memory: { select: { id: true, title: true, patternName: true, occurredAt: true, symbol: true } },
            },
          },
          _count: { select: { memories: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold">{t(locale, "quick.title")}</h1>
        <p className="text-dim text-sm mt-1">{t(locale, "quick.subtitle")}</p>
      </div>
      <QuickRecallGrid
        pinned={saved.map((s) => s.pattern)}
        locale={locale}
        emptyLabel={t(locale, "quick.empty")}
        emptyCta={t(locale, "quick.emptyCta")}
        noCasesLabel={t(locale, "quick.noCases")}
        viewAllLabel={t(locale, "quick.viewAll")}
      />
    </div>
  );
}
