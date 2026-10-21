import { z } from "zod";

// §8-10: Pattern Iconは「値動き構造」を表す共通文法(Visual Grammar)から構成する。
// 価格数字・時刻・ローソク足の細部は持たない。AI画像生成ではなくSVG描画用の構造化データ。

export const markerTypeEnum = z.enum([
  "breakout",
  "failed_breakout",
  "retest",
  "structure_shift",
  "expansion",
  "rejection",
  "rebreak",
  "double_test",
]);
export type MarkerType = z.infer<typeof markerTypeEnum>;

export const iconDefinitionSchema = z.object({
  version: z.literal(1).default(1),
  viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]).default([0, 0, 100, 100]),
  pricePath: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
  levels: z.array(z.object({ y: z.number(), type: z.enum(["resistance", "support"]).default("resistance") })).default([]),
  markers: z.array(z.object({ x: z.number(), y: z.number(), type: markerTypeEnum })).default([]),
});
export type IconDefinition = z.infer<typeof iconDefinitionSchema>;

export function safeParseIcon(json: string | null | undefined): IconDefinition | null {
  if (!json) return null;
  try {
    return iconDefinitionSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

// §12: state_sequence（キーワード配列）からアイコンを自動生成する。
// MVPでは「ユーザー確認でも構わない」ヒューリスティック生成（§11）。手描き編集はP1。
const UP_KEYWORDS = ["up", "approach_up", "strong_approach", "rally", "recovery", "higher", "rebreak_up", "breakout", "expansion_up"];
const DOWN_KEYWORDS = ["down", "approach_down", "decline", "drop", "lower", "break_back_below", "rejection", "failed_followthrough", "downside"];
const MARKER_KEYWORDS: Record<string, MarkerType> = {
  temporary_break: "breakout",
  breakout: "breakout",
  break: "breakout",
  failed_followthrough: "failed_breakout",
  failed_breakout: "failed_breakout",
  failure: "failed_breakout",
  rejection: "rejection",
  lower_high: "structure_shift",
  higher_low: "structure_shift",
  structure_shift: "structure_shift",
  structure_break: "structure_shift",
  retest: "retest",
  rebreak: "rebreak",
  rebreak_up: "rebreak",
  double_test: "double_test",
  expansion: "expansion",
  downside_expansion: "expansion",
  upside_expansion: "expansion",
};
const LEVEL_KEYWORDS = ["resistance", "support", "level", "test_resistance", "test_support"];

export function generateIconFromStateSequence(sequence: string[]): IconDefinition {
  const n = Math.max(sequence.length, 2);
  const stepX = 100 / (n - 1 || 1);
  let y = 65; // 0=top(high) .. 100=bottom(low); 中央よりやや下から開始
  const pricePath: { x: number; y: number }[] = [{ x: 0, y }];
  const levels: { y: number; type: "resistance" | "support" }[] = [];
  const markers: { x: number; y: number; type: MarkerType }[] = [];
  let levelY: number | null = null;

  sequence.forEach((raw, i) => {
    const token = raw.toLowerCase();
    const x = stepX * (i + 1);
    const isUp = UP_KEYWORDS.some((k) => token.includes(k));
    const isDown = DOWN_KEYWORDS.some((k) => token.includes(k));
    const magnitude = token.includes("strong") || token.includes("expansion") ? 22 : 12;

    if (isUp && !isDown) y -= magnitude;
    else if (isDown) y += magnitude;
    else y += Math.sin(i * 1.7) * 3; // range的な横ばい揺らぎ（決定論的: SSR/クライアントのhydration不一致を避ける）

    y = Math.max(8, Math.min(92, y));
    pricePath.push({ x, y });

    if (LEVEL_KEYWORDS.some((k) => token.includes(k)) && levelY === null) {
      levelY = y;
      levels.push({ y, type: token.includes("support") ? "support" : "resistance" });
    }

    for (const [kw, markerType] of Object.entries(MARKER_KEYWORDS)) {
      if (token.includes(kw)) {
        markers.push({ x, y, type: markerType });
        break;
      }
    }
  });

  return { version: 1, viewBox: [0, 0, 100, 100], pricePath, levels, markers };
}
