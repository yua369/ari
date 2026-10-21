import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeParseIcon } from "@/lib/pattern-icon";
import { PatternIcon } from "@/components/pattern/PatternIcon";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "審査待ち",
  APPROVED_EXISTING: "既存Patternのエイリアスとして承認",
  APPROVED_VARIANT: "Variantとして承認",
  APPROVED_NEW: "新規Patternとして承認",
  REJECTED: "却下",
};

export default async function MyPatternCandidatesPage() {
  const user = await requireAuth("/patterns/candidates");
  const candidates = await prisma.patternCandidate.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">自分が送ったPattern候補</h1>
          <p className="text-dim text-sm mt-1">全{candidates.length}件</p>
        </div>
        <Link href="/patterns/candidates/new" className="btn btn-primary !text-xs">
          + 新しい候補を送る
        </Link>
      </div>
      {candidates.length === 0 ? (
        <div className="surface p-8 text-center text-dim text-sm">まだ送った候補はありません。</div>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map((c) => {
            const icon = safeParseIcon(c.suggestedIcon);
            return (
              <div key={c.id} className="surface p-3.5 flex items-center gap-3">
                <div className="w-14 h-14 shrink-0">{icon && <PatternIcon icon={icon} title={c.suggestedName} />}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.suggestedName}</p>
                  <p className="text-faint text-xs">{STATUS_LABEL[c.status]}</p>
                  {c.resolution && <p className="text-faint text-xs mt-0.5">{c.resolution}</p>}
                </div>
                {c.resolvedPatternId && (
                  <Link href={`/patterns/${c.resolvedPatternId}`} className="btn !text-xs">
                    見る
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
