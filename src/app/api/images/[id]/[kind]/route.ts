import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contentTypeFor } from "@/lib/storage";

// §61 Privacy: PRIVATE Memoryの画像は所有者/Adminのみ。PUBLICは誰でも閲覧可（URLを知っていればではなく、
// Memory自体がPUBLICのときだけ）。画像の実データはDB(Bytes列)から配信する。
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/images/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  if (kind !== "original" && kind !== "thumb") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  const image = await prisma.chartImage.findUnique({ where: { id }, include: { memory: true } });
  if (!image) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (image.memory.visibility !== "PUBLIC") {
    const user = await getCurrentUser();
    if (!user || (user.id !== image.memory.userId && !user.isAdmin)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const data = kind === "original" ? image.originalData : image.thumbnailData ?? image.originalData;
  const filename = kind === "original" ? image.originalFile : image.thumbnailFile ?? image.originalFile;
  if (!data) return NextResponse.json({ error: "file not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypeFor(filename),
      "Cache-Control": image.memory.visibility === "PUBLIC" ? "public, max-age=31536000, immutable" : "private, max-age=31536000, immutable",
    },
  });
}
