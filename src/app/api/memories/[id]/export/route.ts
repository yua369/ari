import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { patternName as pName } from "@/lib/pattern-types";

// §63(fx-analysis-memoryより移植) Export: 自分自身の知識資産なので、いつでも生データを持ち出せるようにする。
// PUBLICなら誰でも、PRIVATEなら本人/Adminのみ。
export async function GET(req: NextRequest, ctx: RouteContext<"/api/memories/[id]/export">) {
  const { id } = await ctx.params;
  const format = req.nextUrl.searchParams.get("format") === "md" ? "md" : "json";
  const user = await getCurrentUser();

  const memory = await prisma.memory.findUnique({
    where: { id },
    include: {
      images: { orderBy: { storyOrder: "asc" } },
      patterns: { include: { pattern: true } },
      revisions: { orderBy: { createdAt: "asc" } },
      user: { select: { username: true } },
    },
  });

  if (!memory || memory.deletedAt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const isOwner = user?.id && memory.userId === user.id;
  if (memory.visibility !== "PUBLIC" && !isOwner && !user?.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const filenameBase = `fx-pattern-memory-${memory.id}`;

  if (format === "json") {
    const payload = {
      schema_version: "1.0",
      id: memory.id,
      symbol: memory.symbol,
      marketType: memory.marketType,
      occurredAt: memory.occurredAt,
      title: memory.title,
      patternName: memory.patternName,
      summary: memory.summary,
      direction: memory.direction,
      outcome: memory.outcome,
      processQuality: memory.processQuality,
      rMultiple: memory.rMultiple,
      chatgptRawAnalysis: memory.chatgptRawAnalysis,
      entryReason: memory.entryReason,
      invalidation: memory.invalidation,
      lesson: memory.lesson,
      myNote: isOwner || user?.isAdmin ? memory.myNote : null,
      visibility: memory.visibility,
      contributor: memory.user.username,
      images: memory.images.map((i) => ({ id: i.id, role: i.role, timeframe: i.timeframe, caption: i.caption })),
      patterns: memory.patterns.map((mp) => ({ id: mp.patternId, nameJa: mp.pattern.nameJa, nameEn: mp.pattern.nameEn, slug: mp.pattern.slug, caseType: mp.caseType })),
      revisions: memory.revisions.map((r) => ({ field: r.field, content: r.content, createdAt: r.createdAt })),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
      },
    });
  }

  const md = `# ${memory.patternName}

- Symbol: ${memory.symbol}
- Date: ${memory.occurredAt.toISOString()}
- Direction: ${memory.direction} / Outcome: ${memory.outcome} / Process Quality: ${memory.processQuality}${memory.rMultiple != null ? ` / R: ${memory.rMultiple}` : ""}
- Visibility: ${memory.visibility}
- Contributor: @${memory.user.username}

## Summary
${memory.summary || "(empty)"}

## ChatGPT Raw Analysis (verbatim)
${memory.chatgptRawAnalysis || "(not recorded)"}

## Entry Reason
${memory.entryReason || "(empty)"}

## Invalidation
${memory.invalidation || "(empty)"}

## Lesson
${memory.lesson || "(empty)"}
${
  isOwner || user?.isAdmin
    ? `
## My Note
${memory.myNote || "(empty)"}
`
    : ""
}
## Pattern
${memory.patterns.map((mp) => `- ${pName(mp.pattern, "en")} (${mp.pattern.slug}) [${mp.caseType}]`).join("\n") || "(UNCLASSIFIED)"}

---
Exported from FX PATTERN MEMORY. schema_version: 1.0
`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.md"`,
    },
  });
}
