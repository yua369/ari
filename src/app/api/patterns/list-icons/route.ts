import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const patterns = await prisma.pattern.findMany({
    where: { slug: { not: "unclassified" } },
    orderBy: { nameJa: "asc" },
    select: { id: true, nameJa: true, nameEn: true, iconDefinition: true, aliases: { select: { alias: true } } },
  });
  return NextResponse.json({
    patterns: patterns.map((p) => ({ ...p, aliases: p.aliases.map((a) => a.alias) })),
  });
}
