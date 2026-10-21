import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 投稿フォームのPattern選択用。Patternは公開情報なので認証不要。
export async function GET() {
  const patterns = await prisma.pattern.findMany({ orderBy: { nameJa: "asc" }, select: { id: true, nameJa: true } });
  return NextResponse.json({ patterns });
}
