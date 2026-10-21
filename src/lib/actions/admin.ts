"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function resolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED") {
  await requireAdmin();
  await prisma.report.update({ where: { id: reportId }, data: { status } });
  revalidatePath("/admin/reports");
}

// §59 Admin: 通報されたMemoryを非公開化する（削除はしない。投稿者の資産を奪わない）。
export async function takedownMemoryAction(memoryId: string) {
  await requireAdmin();
  await prisma.memory.update({ where: { id: memoryId }, data: { visibility: "PRIVATE" } });
  revalidatePath("/admin/reports");
}
