import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { patternName as pName } from "@/lib/pattern-types";
import { MemoryForm, type ExistingMemory } from "@/components/memory/MemoryForm";

export default async function EditMemoryPage({ params }: PageProps<"/memories/[id]/edit">) {
  const { id } = await params;
  const user = await requireAuth(`/memories/${id}/edit`);
  const locale = await getLocale();

  const memory = await prisma.memory.findUnique({
    where: { id },
    include: { patterns: { include: { pattern: true } }, images: { orderBy: { storyOrder: "asc" } } },
  });
  if (!memory) notFound();
  if (memory.userId !== user.id && !user.isAdmin) notFound();

  const existing: ExistingMemory = {
    id: memory.id,
    symbol: memory.symbol,
    occurredAt: memory.occurredAt.toISOString().slice(0, 16),
    title: memory.title,
    patternName: memory.patternName,
    summary: memory.summary,
    direction: memory.direction,
    outcome: memory.outcome,
    processQuality: memory.processQuality,
    rMultiple: memory.rMultiple?.toString() ?? "",
    chatgptRawAnalysis: memory.chatgptRawAnalysis ?? "",
    entryReason: memory.entryReason ?? "",
    invalidation: memory.invalidation ?? "",
    lesson: memory.lesson ?? "",
    myNote: memory.myNote ?? "",
    visibility: memory.visibility,
    patterns: memory.patterns.map((mp) => ({ patternId: mp.patternId, patternName: pName(mp.pattern, locale), caseType: mp.caseType })),
    images: memory.images.map((img) => ({ id: img.id, role: img.role, timeframe: img.timeframe })),
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold">{t(locale, "case.edit")}: {memory.patternName}</h1>
      </div>
      <MemoryForm existing={existing} locale={locale} />
    </div>
  );
}
