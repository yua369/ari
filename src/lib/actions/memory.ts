"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { memoryCoreSchema } from "@/lib/validation";
import { saveChartImage, validateImageFile } from "@/lib/storage";
import { buildSearchText } from "@/lib/search";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { patternName as pName } from "@/lib/pattern-types";
import type { Timeframe, ImageRole } from "@/generated/prisma/enums";

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function extractCore(formData: FormData) {
  const payload = {
    symbol: String(formData.get("symbol") ?? ""),
    marketType: String(formData.get("marketType") ?? "FX"),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    title: String(formData.get("title") ?? ""),
    patternName: String(formData.get("patternName") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    direction: String(formData.get("direction") ?? "WAIT"),
    outcome: String(formData.get("outcome") ?? "UNKNOWN"),
    processQuality: String(formData.get("processQuality") ?? "UNRATED"),
    rMultiple: String(formData.get("rMultiple") ?? ""),
    chatgptRawAnalysis: String(formData.get("chatgptRawAnalysis") ?? ""),
    entryReason: String(formData.get("entryReason") ?? ""),
    invalidation: String(formData.get("invalidation") ?? ""),
    lesson: String(formData.get("lesson") ?? ""),
    myNote: String(formData.get("myNote") ?? ""),
    visibility: String(formData.get("visibility") ?? "PRIVATE"),
  };
  // §81 Error UX: 生のZodError JSONをユーザーに見せない。
  try {
    return memoryCoreSchema.parse(payload);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      throw new Error(first?.message ?? "入力内容を確認してください");
    }
    throw err;
  }
}

// §13-14/§26 Image Security・Data Integrity: DB行を作る前に必ず全ファイルを検証する。
// ここで弾けば、不正ファイルのせいで画像なしのMemory行だけが孤立して残ることを防げる。
async function validateIncomingImages(formData: FormData) {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;
  const locale = await getLocale();
  for (const file of files) {
    const error = validateImageFile(file);
    if (!error) continue;
    const key = error.code === "TOO_LARGE" ? "error.imageTooLarge" : error.code === "EMPTY" ? "error.imageEmpty" : "error.imageInvalidType";
    throw new Error(`${t(locale, key)} ${error.fileName}`);
  }
}

async function saveImages(memoryId: string, formData: FormData, existingCount: number) {
  const files = formData.getAll("images");
  const imageMetas = parseJsonField<{ timeframe: string; role?: string; storyOrder: number; caption?: string }[]>(
    formData,
    "imageMeta",
    []
  );
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File) || file.size === 0) continue;
    const meta = imageMetas[i] ?? { timeframe: "OTHER", role: "CONTEXT", storyOrder: existingCount + i };
    const baseName = `${meta.timeframe}-${String(meta.storyOrder).padStart(2, "0")}-${existingCount + i}`;
    const saved = await saveChartImage(memoryId, file, baseName);
    await prisma.chartImage.create({
      data: {
        memoryId,
        timeframe: meta.timeframe as Timeframe,
        role: (meta.role ?? "CONTEXT") as ImageRole,
        storyOrder: meta.storyOrder,
        caption: meta.caption || null,
        originalFile: saved.originalFile,
        thumbnailFile: saved.thumbnailFile,
        originalData: saved.originalData,
        thumbnailData: saved.thumbnailData,
        width: saved.width,
        height: saved.height,
      },
    });
  }
}

// §9/§28 Pattern選択時のTitle: クライアントが送るpatternNameを信用せず、
// 既存Patternを選んだ場合はサーバー側でPatternの正式名称（現在のlocale）を採用する。
// 新規候補名がある場合はそれを、どちらも無ければUNCLASSIFIEDとする。
async function resolvePatternTitle(formData: FormData, locale: Awaited<ReturnType<typeof getLocale>>) {
  const patternId = String(formData.get("patternId") ?? "");
  const newCandidateName = String(formData.get("newCandidateName") ?? "").trim();
  if (patternId) {
    const pattern = await prisma.pattern.findUnique({ where: { id: patternId } });
    if (pattern) return pName(pattern, locale);
  }
  if (newCandidateName) return newCandidateName;
  return "UNCLASSIFIED";
}

async function refreshSearchText(memoryId: string) {
  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    include: { patterns: { include: { pattern: { include: { aliases: true } } } } },
  });
  if (!memory) return;
  const searchText = buildSearchText(memory);
  await prisma.memory.update({ where: { id: memoryId }, data: { searchText } });
}

export async function createMemoryAction(formData: FormData): Promise<{ id: string }> {
  const user = await requireAuth();
  const data = extractCore(formData);
  await validateIncomingImages(formData); // Memory行を作る前に検証する
  const locale = await getLocale();
  const resolvedTitle = await resolvePatternTitle(formData, locale);

  const memory = await prisma.memory.create({
    data: {
      userId: user.id,
      symbol: data.symbol,
      marketType: data.marketType,
      occurredAt: new Date(data.occurredAt),
      title: resolvedTitle,
      patternName: resolvedTitle,
      summary: data.summary || "",
      direction: data.direction,
      outcome: data.outcome,
      processQuality: data.processQuality,
      rMultiple: data.rMultiple ? Number(data.rMultiple) : null,
      chatgptRawAnalysis: data.chatgptRawAnalysis || null,
      entryReason: data.entryReason || null,
      invalidation: data.invalidation || null,
      lesson: data.lesson || null,
      myNote: data.myNote || null,
      visibility: data.visibility,
    },
  });

  await saveImages(memory.id, formData, 0);

  // §22-24 Pattern選択: 既存Patternを選んだ場合はリンク、新規候補なら候補として保存（UNCLASSIFIEDのまま）
  const patternId = String(formData.get("patternId") ?? "");
  const newCandidateName = String(formData.get("newCandidateName") ?? "").trim();
  if (patternId) {
    await prisma.memoryPattern.create({ data: { memoryId: memory.id, patternId, caseType: "EXAMPLE" } });
  } else if (newCandidateName) {
    const { generateIconFromStateSequence } = await import("@/lib/pattern-icon");
    const icon = generateIconFromStateSequence([newCandidateName]);
    await prisma.patternCandidate.create({
      data: {
        creatorId: user.id,
        memoryId: memory.id,
        suggestedName: newCandidateName,
        suggestedDescription: String(formData.get("newCandidateDescription") ?? "") || null,
        suggestedIcon: JSON.stringify(icon),
      },
    });
  }

  await refreshSearchText(memory.id);

  revalidatePath("/");
  redirect(`/memories/${memory.id}`);
}

export async function updateMemoryAction(memoryId: string, formData: FormData): Promise<void> {
  const user = await requireAuth();
  const existing = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (existing.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");

  const data = extractCore(formData);
  await validateIncomingImages(formData);
  const updateLocale = await getLocale();
  const resolvedUpdateTitle = await resolvePatternTitle(formData, updateLocale);

  // ChatGPT原文はImmutable想定。変更があれば古い内容をRevisionへ退避してから上書きする。
  if (
    existing.chatgptRawAnalysis &&
    existing.chatgptRawAnalysis !== (data.chatgptRawAnalysis || null) &&
    data.chatgptRawAnalysis
  ) {
    await prisma.memoryRevision.create({
      data: { memoryId, field: "chatgptRawAnalysis", content: existing.chatgptRawAnalysis },
    });
  }

  await prisma.memory.update({
    where: { id: memoryId },
    data: {
      symbol: data.symbol,
      marketType: data.marketType,
      occurredAt: new Date(data.occurredAt),
      title: resolvedUpdateTitle,
      patternName: resolvedUpdateTitle,
      summary: data.summary || "",
      direction: data.direction,
      outcome: data.outcome,
      processQuality: data.processQuality,
      rMultiple: data.rMultiple ? Number(data.rMultiple) : null,
      chatgptRawAnalysis: data.chatgptRawAnalysis || null,
      entryReason: data.entryReason || null,
      invalidation: data.invalidation || null,
      lesson: data.lesson || null,
      myNote: data.myNote || null,
      visibility: data.visibility,
    },
  });

  // Pattern Pickerで新しく選んだ既存Patternがあれば、まだリンクされていない場合のみ追加する。
  // （解除は専用のunlinkPatternFromMemoryActionが担当）
  const newPatternId = String(formData.get("patternId") ?? "");
  if (newPatternId) {
    const alreadyLinked = await prisma.memoryPattern.findUnique({
      where: { memoryId_patternId: { memoryId, patternId: newPatternId } },
    });
    if (!alreadyLinked) {
      await prisma.memoryPattern.create({ data: { memoryId, patternId: newPatternId, caseType: "EXAMPLE" } });
    }
  }

  const existingCount = await prisma.chartImage.count({ where: { memoryId } });
  await saveImages(memoryId, formData, existingCount);
  await refreshSearchText(memoryId);

  revalidatePath("/");
  revalidatePath(`/memories/${memoryId}`);
  redirect(`/memories/${memoryId}`);
}

// §29 Edit Case: 既存画像を個別に削除する（Ownerのみ）。
export async function removeChartImageAction(chartImageId: string) {
  const user = await requireAuth();
  const image = await prisma.chartImage.findUnique({ where: { id: chartImageId }, include: { memory: true } });
  if (!image) return;
  if (image.memory.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");

  // 画像の実データはDB(Bytes列)に保存しているため、行のdeleteだけで実データも消える。
  await prisma.chartImage.delete({ where: { id: chartImageId } });
  await refreshSearchText(image.memoryId);
  revalidatePath(`/memories/${image.memoryId}`);
  revalidatePath(`/memories/${image.memoryId}/edit`);
}

export async function deleteMemoryAction(memoryId: string) {
  const user = await requireAuth();
  const existing = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (existing.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");
  await prisma.memory.update({ where: { id: memoryId }, data: { deletedAt: new Date() } });
  revalidatePath("/");
  redirect("/mypage");
}

export async function restoreMemoryAction(memoryId: string) {
  const user = await requireAuth();
  const existing = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (existing.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");
  await prisma.memory.update({ where: { id: memoryId }, data: { deletedAt: null } });
  revalidatePath("/");
  revalidatePath("/mypage");
}

export async function permanentlyDeleteMemoryAction(memoryId: string) {
  const user = await requireAuth();
  const existing = await prisma.memory.findUniqueOrThrow({ where: { id: memoryId } });
  if (existing.userId !== user.id && !user.isAdmin) throw new Error("権限がありません");
  // ChartImageはonDelete: Cascadeのため、Memory削除で画像データ(DB Bytes列)も一緒に消える。
  await prisma.memory.delete({ where: { id: memoryId } });
  revalidatePath("/mypage");
}

export async function toggleSaveMemoryAction(memoryId: string) {
  const user = await requireAuth();
  const existing = await prisma.savedMemory.findUnique({
    where: { userId_memoryId: { userId: user.id, memoryId } },
  });
  if (existing) {
    await prisma.savedMemory.delete({ where: { userId_memoryId: { userId: user.id, memoryId } } });
  } else {
    await prisma.savedMemory.create({ data: { userId: user.id, memoryId } });
  }
  revalidatePath(`/memories/${memoryId}`);
  revalidatePath("/saved");
}

export async function reportMemoryAction(memoryId: string, formData: FormData) {
  const user = await requireAuth();
  const reason = String(formData.get("reason") ?? "OTHER");
  const detail = String(formData.get("detail") ?? "");
  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: "MEMORY",
      memoryId,
      reason: reason as never,
      detail: detail || null,
    },
  });
  revalidatePath(`/memories/${memoryId}`);
}
