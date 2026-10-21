"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { iconDefinitionSchema, generateIconFromStateSequence } from "@/lib/pattern-icon";
import { slugify } from "@/lib/pattern-types";

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function upsertFamily(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  return prisma.patternFamily.upsert({ where: { slug }, update: {}, create: { name: trimmed, slug } });
}

// §38 検索。名前・Aliasの部分一致で既存Pattern候補を返す（§32 増殖防止の一次チェック）。
export async function findSimilarPatternsAction(name: string) {
  await requireAuth();
  const q = name.trim();
  if (q.length < 2) return [];
  return prisma.pattern.findMany({
    where: { OR: [{ nameJa: { contains: q } }, { nameEn: { contains: q } }, { aliases: { some: { alias: { contains: q } } } }] },
    take: 5,
    select: { id: true, nameJa: true, nameEn: true, slug: true },
  });
}

// §31 Pattern Governance: 一般ユーザーは直接Patternを作れず、候補として送る。
export async function submitPatternCandidateAction(formData: FormData) {
  const user = await requireAuth();
  const suggestedName = String(formData.get("name") ?? "").trim();
  const suggestedDescription = String(formData.get("description") ?? "").trim();
  const stateSequence = parseJsonField<string[]>(formData, "stateSequence", []);
  const iconMode = String(formData.get("iconMode") ?? "generate");
  const customIconJson = String(formData.get("iconJson") ?? "");

  if (!suggestedName) throw new Error("Pattern名は必須です");

  const icon =
    iconMode === "custom" && customIconJson
      ? iconDefinitionSchema.parse(JSON.parse(customIconJson))
      : generateIconFromStateSequence(stateSequence.length > 0 ? stateSequence : [suggestedName]);

  await prisma.patternCandidate.create({
    data: {
      creatorId: user.id,
      suggestedName,
      suggestedDescription: suggestedDescription || null,
      suggestedIcon: JSON.stringify(icon),
      suggestedSequence: JSON.stringify(stateSequence),
    },
  });

  revalidatePath("/patterns/candidates");
  redirect("/patterns/candidates");
}

// Admin: Patternを直接作成（候補承認の結果として、または初期Seed用）。
export async function adminCreatePatternAction(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();

  const nameJa = String(formData.get("nameJa") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim() || nameJa;
  const familyName = String(formData.get("family") ?? "").trim();
  const descriptionJa = String(formData.get("descriptionJa") ?? "").trim();
  const aliases = String(formData.get("aliases") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const stateSequence = parseJsonField<string[]>(formData, "stateSequence", []);
  const iconMode = String(formData.get("iconMode") ?? "generate");
  const customIconJson = String(formData.get("iconJson") ?? "");
  const parentPatternId = String(formData.get("parentPatternId") ?? "") || null;
  const resolvedCandidateId = String(formData.get("resolvedCandidateId") ?? "") || null;

  if (!nameJa) throw new Error("Pattern名は必須です");

  const icon =
    iconMode === "custom" && customIconJson
      ? iconDefinitionSchema.parse(JSON.parse(customIconJson))
      : generateIconFromStateSequence(stateSequence.length > 0 ? stateSequence : [nameJa]);

  const family = familyName ? await upsertFamily(familyName) : null;
  const slug = slugify(nameEn || nameJa);

  const pattern = await prisma.pattern.create({
    data: {
      nameJa,
      nameEn,
      slug,
      descriptionJa: descriptionJa || null,
      familyId: family?.id ?? null,
      parentPatternId,
      stateSequence: JSON.stringify(stateSequence),
      iconDefinition: JSON.stringify(icon),
      aliases: { create: aliases.map((alias) => ({ alias })) },
    },
  });

  if (resolvedCandidateId) {
    const admin = await requireAdmin();
    await prisma.patternCandidate.update({
      where: { id: resolvedCandidateId },
      data: {
        status: parentPatternId ? "APPROVED_VARIANT" : "APPROVED_NEW",
        resolvedPatternId: pattern.id,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  revalidatePath("/patterns");
  revalidatePath("/patterns/candidates");
  redirect(`/patterns/${pattern.id}`);
}

export async function resolveCandidateAsExistingAction(candidateId: string, patternId: string) {
  const admin = await requireAdmin();
  await prisma.patternCandidate.update({
    where: { id: candidateId },
    data: { status: "APPROVED_EXISTING", resolvedPatternId: patternId, reviewedBy: admin.id, reviewedAt: new Date() },
  });
  revalidatePath("/patterns/candidates");
}

export async function rejectCandidateAction(candidateId: string, resolution: string) {
  const admin = await requireAdmin();
  await prisma.patternCandidate.update({
    where: { id: candidateId },
    data: { status: "REJECTED", resolution, reviewedBy: admin.id, reviewedAt: new Date() },
  });
  revalidatePath("/patterns/candidates");
}

export async function togglePatternPinAction(patternId: string) {
  await requireAdmin(); // §41 MY QUICK PATTERNSはP0ではAdmin選定のPopular相当。個人Pinは§91 SavedPatternで提供。
  const pattern = await prisma.pattern.findUniqueOrThrow({ where: { id: patternId } });
  await prisma.pattern.update({ where: { id: patternId }, data: { isPinned: !pattern.isPinned } });
  revalidatePath("/patterns");
  revalidatePath("/");
  revalidatePath(`/patterns/${patternId}`);
}

export async function toggleSavePatternAction(patternId: string) {
  const user = await requireAuth();
  const existing = await prisma.savedPattern.findUnique({ where: { userId_patternId: { userId: user.id, patternId } } });
  if (existing) {
    await prisma.savedPattern.delete({ where: { userId_patternId: { userId: user.id, patternId } } });
  } else {
    await prisma.savedPattern.create({ data: { userId: user.id, patternId } });
  }
  revalidatePath(`/patterns/${patternId}`);
  revalidatePath("/saved");
  revalidatePath("/");
}

// Memory ↔ Pattern のリンク（Many-to-Many、承認済みPatternのみ対象）
export async function linkPatternToMemoryAction(memoryId: string, formData: FormData) {
  const user = await requireAuth();
  const memory = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (memory.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");

  const patternId = String(formData.get("patternId") ?? "");
  const caseType = String(formData.get("caseType") ?? "EXAMPLE");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!patternId) return;

  const last = await prisma.memoryPattern.findFirst({ where: { memoryId }, orderBy: { sequenceOrder: "desc" } });

  await prisma.memoryPattern.upsert({
    where: { memoryId_patternId: { memoryId, patternId } },
    update: { caseType: caseType as never, notes: notes || null },
    create: { memoryId, patternId, caseType: caseType as never, sequenceOrder: (last?.sequenceOrder ?? 0) + 1, notes: notes || null },
  });

  revalidatePath(`/memories/${memoryId}`);
  revalidatePath("/patterns");
  revalidatePath(`/patterns/${patternId}`);
}

export async function unlinkPatternFromMemoryAction(memoryId: string, patternId: string) {
  const user = await requireAuth();
  const memory = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (memory.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");
  await prisma.memoryPattern.delete({ where: { memoryId_patternId: { memoryId, patternId } } });
  revalidatePath(`/memories/${memoryId}`);
  revalidatePath("/patterns");
  revalidatePath(`/patterns/${patternId}`);
}
