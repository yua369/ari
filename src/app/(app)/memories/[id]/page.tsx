import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { DirectionBadge, OutcomeBadge, ProcessQualityBadge, VisibilityBadge } from "@/components/ui/Badge";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { safeParseIcon } from "@/lib/pattern-icon";
import { CASE_TYPE_LABEL, patternName as pName } from "@/lib/pattern-types";
import { SaveMemoryButton, DeleteMemoryButton, ReportButton } from "@/components/memory/MemoryWidgets";
import { CaseChartGallery } from "@/components/memory/CaseChartGallery";
import { RawAnalysisViewer } from "@/components/memory/RawAnalysisViewer";
import { ExportButtons } from "@/components/memory/ExportButtons";

// §17-20 Case Detail: Chartを主役に。CHART COLUMN(大) + INFORMATION PANEL(右)。下部にRELATED CASES。
export default async function MemoryDetailPage({ params }: PageProps<"/memories/[id]">) {
  const { id } = await params;
  const [viewer, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const memory = await prisma.memory.findUnique({
    where: { id },
    include: {
      images: { orderBy: { storyOrder: "asc" } },
      patterns: { orderBy: { sequenceOrder: "asc" }, include: { pattern: true } },
      user: { select: { id: true, username: true } },
      revisions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!memory || memory.deletedAt) notFound();

  const isOwner = viewer?.id === memory.user.id;
  const isAdmin = Boolean(viewer?.isAdmin);
  if (memory.visibility !== "PUBLIC" && !isOwner && !isAdmin) notFound();

  const savedCount = await prisma.savedMemory.count({ where: { memoryId: memory.id } });
  const isSaved = viewer
    ? Boolean(await prisma.savedMemory.findUnique({ where: { userId_memoryId: { userId: viewer.id, memoryId: memory.id } } }))
    : false;

  const entryImages = memory.images.filter((i) => i.role === "ENTRY");
  const afterImages = memory.images.filter((i) => i.role === "AFTER");
  const otherImages = memory.images.filter((i) => i.role !== "ENTRY" && i.role !== "AFTER");

  // §20/§67 Related Cases: 同じPatternの他Case(自分のPrivateも含むが、他人のPrivateは除外)
  const primaryPatternId = memory.patterns[0]?.patternId;
  const relatedCases = primaryPatternId
    ? await prisma.memoryPattern.findMany({
        where: {
          patternId: primaryPatternId,
          memoryId: { not: memory.id },
          memory: {
            deletedAt: null,
            OR: [{ visibility: "PUBLIC" }, ...(viewer ? [{ userId: viewer.id }] : [])],
          },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { memory: { include: { images: { select: { id: true, thumbnailFile: true, storyOrder: true } } } } },
      })
    : [];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {memory.visibility !== "PUBLIC" && (isOwner || isAdmin) && (
        <div className="surface p-3 text-xs" style={{ borderColor: "var(--tag-amber)", color: "var(--tag-amber)" }}>
          {t(locale, "case.privateNotice")}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-faint mono">
            <span>{memory.symbol}</span>
            {entryImages[0] && (
              <>
                <span>·</span>
                <span>{entryImages[0].timeframe}</span>
              </>
            )}
            <span>·</span>
            <time dateTime={memory.occurredAt.toISOString()}>{memory.occurredAt.toISOString().slice(0, 16).replace("T", " ")}</time>
            <span>·</span>
            <span>@{memory.user.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons memoryId={memory.id} jsonLabel={t(locale, "case.exportJson")} mdLabel={t(locale, "case.exportMd")} />
            <SaveMemoryButton
              memoryId={memory.id}
              initialSaved={isSaved}
              initialCount={savedCount}
              viewerExists={Boolean(viewer)}
              label={t(locale, "case.saved")}
            />
            {!isOwner && viewer && <ReportButton memoryId={memory.id} label={t(locale, "case.report")} sentLabel={t(locale, "case.reportSent")} />}
            {(isOwner || isAdmin) && (
              <>
                <Link href={`/memories/${memory.id}/edit`} className="btn !text-xs">
                  {t(locale, "case.edit")}
                </Link>
                <DeleteMemoryButton memoryId={memory.id} label={t(locale, "case.delete")} confirmText={t(locale, "case.deleteConfirm")} confirmBtn={t(locale, "case.deleteConfirmBtn")} cancelBtn={t(locale, "case.cancel")} />
              </>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold leading-tight">{memory.patternName}</h1>
        <div className="flex flex-wrap gap-2">
          <DirectionBadge value={memory.direction} locale={locale} />
          <OutcomeBadge value={memory.outcome} locale={locale} />
          <ProcessQualityBadge value={memory.processQuality} />
          <VisibilityBadge value={memory.visibility} locale={locale} />
          {memory.rMultiple != null && (
            <span className="badge">
              {memory.rMultiple > 0 ? "+" : ""}
              {memory.rMultiple}R
            </span>
          )}
        </div>
      </section>

      {/* §17/§61-62 Terminal Layout: 左=Chart(主役・大)、右=Information Panel */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="flex flex-col gap-8 min-w-0">
          <CaseChartGallery
            entryImages={entryImages}
            afterImages={afterImages}
            otherImages={otherImages}
            entryTitle={t(locale, "case.entryChart")}
            afterTitle={t(locale, "case.afterChart")}
            otherTitle={t(locale, "case.otherCharts")}
            noImageLabel={t(locale, "case.noImage")}
          />

          {(memory.chatgptRawAnalysis || memory.revisions.length > 0) && (
            <RawAnalysisViewer
              title={t(locale, "case.whatHappened")}
              subtitle={t(locale, "case.whatHappenedSub")}
              content={memory.chatgptRawAnalysis ?? ""}
              revisions={memory.revisions
                .filter((r) => r.field === "chatgptRawAnalysis")
                .map((r) => ({ id: r.id, content: r.content, createdAt: r.createdAt.toISOString() }))}
              historyLabel={t(locale, "case.rawHistory")}
              historyHideLabel={t(locale, "case.rawHistoryHide")}
              emptyLabel={t(locale, "case.rawEmpty")}
            />
          )}
        </div>

        {/* §19 Information Panel */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          {memory.entryReason && (
            <Section title={t(locale, "case.entryReason")}>
              <p className="text-sm text-dim whitespace-pre-wrap">{memory.entryReason}</p>
            </Section>
          )}

          {memory.invalidation && (
            <Section title={t(locale, "case.invalidation")}>
              <p className="text-sm text-dim whitespace-pre-wrap">{memory.invalidation}</p>
            </Section>
          )}

          {memory.lesson && (
            <Section title={t(locale, "case.lesson")}>
              <p className="text-sm text-dim whitespace-pre-wrap">{memory.lesson}</p>
            </Section>
          )}

          {memory.myNote && (isOwner || isAdmin) && (
            <Section title={t(locale, "case.myNote")}>
              <p className="text-sm text-dim whitespace-pre-wrap">{memory.myNote}</p>
            </Section>
          )}

          <Section title={t(locale, "case.pattern")}>
            {memory.patterns.length === 0 ? (
              <span className="badge">UNCLASSIFIED</span>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {memory.patterns.map((mp) => {
                  const icon = safeParseIcon(mp.pattern.iconDefinition);
                  const name = pName(mp.pattern, locale);
                  return (
                    <Link key={mp.patternId} href={`/patterns/${mp.patternId}`} className="surface-2 surface-hover p-3 flex flex-col gap-2 items-center transition-colors">
                      <div className="w-14 h-14">{icon && <PatternIcon icon={icon} title={name} />}</div>
                      <p className="text-xs font-semibold text-center leading-snug">{name}</p>
                      <span className="badge !text-[0.65rem]">{CASE_TYPE_LABEL[mp.caseType]}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* §20/§67 Related Cases: 同じPatternの他Caseを横並びで */}
      {relatedCases.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{t(locale, "case.relatedCases")}</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
            {relatedCases.map((rc) => {
              const thumb =
                rc.memory.images.length > 0
                  ? [...rc.memory.images].sort((a, b) => a.storyOrder - b.storyOrder)[0]
                  : null;
              return (
                <Link
                  key={rc.memoryId}
                  href={`/memories/${rc.memoryId}`}
                  className="surface surface-hover flex flex-col overflow-hidden shrink-0 transition-colors"
                  style={{ width: 200 }}
                >
                  <div className="relative aspect-video bg-black/40">
                    {thumb ? (
                      <Image src={`/api/images/${thumb.id}/thumb`} alt={rc.memory.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-faint text-[0.65rem]">{t(locale, "case.noImage")}</div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <p className="text-xs font-medium truncate">{rc.memory.title}</p>
                    <p className="text-faint text-[0.65rem] mono">{rc.memory.symbol}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-faint text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
