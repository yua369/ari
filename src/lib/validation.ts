import { z } from "zod";

export const timeframeEnum = z.enum(["D1", "H4", "H1", "M30", "M15", "M5", "M1", "OTHER"]);
export const imageRoleEnum = z.enum(["ENTRY", "AFTER", "EXIT", "CONTEXT"]);
export const directionEnum = z.enum(["LONG", "SHORT", "WAIT", "MIXED"]);
export const outcomeEnum = z.enum(["WORKED", "FAILED", "BREAKEVEN", "NO_TRADE", "INVALIDATED", "PARTIAL", "UNKNOWN"]);
export const processQualityEnum = z.enum(["EXCELLENT", "GOOD", "NEUTRAL", "POOR", "UNRATED"]);
export const visibilityEnum = z.enum(["PRIVATE", "PUBLIC"]);

export const imageMetaSchema = z.object({
  timeframe: timeframeEnum,
  role: imageRoleEnum.default("CONTEXT"),
  storyOrder: z.number(),
  caption: z.string().optional().default(""),
});

// §19-21: 基本投稿は Chart / Symbol / Pattern / Result / Analysis だけで成立させる。
// Advanced fields はすべて任意。
export const memoryCoreSchema = z.object({
  symbol: z.string().min(1, "Symbolを入力してください"),
  marketType: z.string().default("FX"),
  occurredAt: z.string().min(1, "日付を入力してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  patternName: z.string().min(1, "値動きの型（自由記述）を入力してください"),
  summary: z.string().optional().default(""),
  direction: directionEnum.default("WAIT"),
  outcome: outcomeEnum.default("UNKNOWN"),
  processQuality: processQualityEnum.default("UNRATED"),
  rMultiple: z.string().optional().default(""),
  chatgptRawAnalysis: z.string().optional().default(""),
  entryReason: z.string().optional().default(""),
  invalidation: z.string().optional().default(""),
  lesson: z.string().optional().default(""),
  myNote: z.string().optional().default(""),
  visibility: visibilityEnum.default("PRIVATE"),
});

export type MemoryCoreInput = z.infer<typeof memoryCoreSchema>;
