import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeParseIcon } from "@/lib/pattern-icon";
import { PatternIcon } from "@/components/pattern/PatternIcon";
import { CandidateActions } from "@/components/pattern/CandidateActions";

export default async function AdminPage() {
  await requireAdmin("/admin");

  const [pendingCandidates, patterns, userCount, memoryCount, openReports] = await Promise.all([
    prisma.patternCandidate.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { creator: { select: { username: true } } },
    }),
    prisma.pattern.findMany({ orderBy: { nameJa: "asc" }, select: { id: true, nameJa: true } }),
    prisma.user.count(),
    prisma.memory.count({ where: { deletedAt: null } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-bold">ADMIN</h1>
        <div className="flex gap-4 text-xs text-faint mt-2">
          <span>Users: {userCount}</span>
          <span>Cases: {memoryCount}</span>
          <span>Open Reports: {openReports}</span>
          <span>Patterns: {patterns.length}</span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">PATTERN CANDIDATES（審査待ち: {pendingCandidates.length}）</h2>
        {pendingCandidates.length === 0 ? (
          <div className="surface p-6 text-center text-dim text-sm">審査待ちの候補はありません。</div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingCandidates.map((c) => {
              const icon = safeParseIcon(c.suggestedIcon);
              return (
                <div key={c.id} className="surface p-4 flex gap-4">
                  <div className="w-16 h-16 shrink-0">{icon && <PatternIcon icon={icon} title={c.suggestedName} />}</div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-semibold">{c.suggestedName}</p>
                      <p className="text-faint text-xs">
                        @{c.creator.username} · {c.createdAt.toISOString().slice(0, 10)}
                      </p>
                      {c.suggestedDescription && <p className="text-dim text-xs mt-1">{c.suggestedDescription}</p>}
                    </div>
                    <CandidateActions candidateId={c.id} suggestedName={c.suggestedName} existingPatterns={patterns} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
