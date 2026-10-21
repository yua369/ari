// §32 初期Pattern Seed。最低限の12 Patternを登録する。
// 実行: npx tsx scripts/seed.ts
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function upsertFamily(name: string, slug: string) {
  const existing = await prisma.patternFamily.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.patternFamily.create({ data: { name, slug } });
  return created.id;
}

type SeedPattern = {
  nameJa: string;
  nameEn: string;
  slug: string;
  familySlug: string | null;
  familyName: string | null;
  descriptionJa: string;
  descriptionEn?: string;
  stateSequence: string[];
  icon: unknown;
  isCore?: boolean;
};

async function upsertPattern(p: SeedPattern) {
  const existing = await prisma.pattern.findUnique({ where: { slug: p.slug } });
  if (existing) {
    console.log(`skip (exists): ${p.nameJa}`);
    return existing.id;
  }
  const familyId = p.familySlug && p.familyName ? await upsertFamily(p.familyName, p.familySlug) : null;
  const created = await prisma.pattern.create({
    data: {
      familyId,
      slug: p.slug,
      nameJa: p.nameJa,
      nameEn: p.nameEn,
      descriptionJa: p.descriptionJa,
      descriptionEn: p.descriptionEn || null,
      stateSequence: JSON.stringify(p.stateSequence),
      iconDefinition: JSON.stringify(p.icon),
      maturity: "OBSERVED",
      isCore: Boolean(p.isCore),
      isPinned: Boolean(p.isCore),
    },
  });
  console.log(`created: ${p.nameJa}`);
  return created.id;
}

// §10 Icon Grammar: pricePath(値動き) / levels(水平線) / markers(breakout/failed_breakout/retest/structure_shift/rebreak/expansion/rejection/double_test)
const patterns: SeedPattern[] = [
  {
    nameJa: "上抜け失敗 → 反落",
    nameEn: "Failed Breakout → Rejection",
    slug: "failed-breakout-rejection",
    familySlug: "failed-breakout",
    familyName: "FAILED BREAKOUT",
    descriptionJa: "強い上昇で上位足水平線へ到達し、一度上抜けるが定着できず高値更新に失敗して反落する型",
    descriptionEn: "Price rallies to a key higher-timeframe level, temporarily breaks above it, but fails to hold and rejects lower.",
    stateSequence: ["strong_approach_up", "test_resistance", "temporary_break", "failed_followthrough", "lower_high", "break_back_below", "downside_expansion"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:78},{x:15,y:65},{x:30,y:50},{x:40,y:35},{x:50,y:28},{x:58,y:32},{x:68,y:45},{x:80,y:60},{x:100,y:72}],
      levels: [{y:35,type:"resistance"}],
      markers: [{x:50,y:28,type:"breakout"},{x:58,y:32,type:"failed_breakout"},{x:68,y:45,type:"structure_shift"}],
    },
    isCore: true,
  },
  {
    nameJa: "反落 → 再挑戦 → 再突破",
    nameEn: "Rejection → Rebreak → Expansion",
    slug: "rejection-rebreak-expansion",
    familySlug: "rebreak",
    familyName: "REBREAK",
    descriptionJa: "水平線から一度反落するが安値更新に失敗し、切り上げて水平線へ再接近、再突破して前回高値を更新し加速する型",
    descriptionEn: "Price rejects from a level, fails to make a new low, rallies back, rebreaks the level, and accelerates to a new high.",
    stateSequence: ["rejection", "decline", "failed_lower_low", "higher_low", "retest", "rebreak_up", "expansion_up"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:35},{x:15,y:55},{x:30,y:68},{x:42,y:60},{x:55,y:40},{x:65,y:35},{x:75,y:20},{x:90,y:8},{x:100,y:5}],
      levels: [{y:35,type:"resistance"}],
      markers: [{x:42,y:60,type:"structure_shift"},{x:65,y:35,type:"retest"},{x:75,y:20,type:"rebreak"},{x:90,y:8,type:"expansion"}],
    },
    isCore: true,
  },
  {
    nameJa: "Breakout → Retest → Continuation",
    nameEn: "Breakout → Retest → Continuation",
    slug: "breakout-retest-continuation",
    familySlug: "retest",
    familyName: "RETEST",
    descriptionJa: "水平線を上抜けた後、一度戻ってリテストし、そのまま継続する型",
    descriptionEn: "Price breaks above a level, pulls back to retest it, then continues in the breakout direction.",
    stateSequence: ["approach_up", "breakout", "retest", "expansion_up"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:75},{x:25,y:55},{x:45,y:30},{x:60,y:40},{x:75,y:33},{x:100,y:10}],
      levels: [{y:38,type:"resistance"}],
      markers: [{x:45,y:30,type:"breakout"},{x:60,y:40,type:"retest"},{x:100,y:10,type:"expansion"}],
    },
  },
  {
    nameJa: "ダブルトップ → 反転",
    nameEn: "Double Top → Reversal",
    slug: "double-top-reversal",
    familySlug: "reversal",
    familyName: "REVERSAL",
    descriptionJa: "同じ高値付近を2回つけて反転する型",
    descriptionEn: "Price tests the same high twice and reverses.",
    stateSequence: ["approach_up", "first_top", "pullback", "second_top", "double_test", "structure_shift", "downside_expansion"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:80},{x:20,y:40},{x:35,y:25},{x:50,y:45},{x:65,y:25},{x:80,y:50},{x:100,y:80}],
      levels: [{y:25,type:"resistance"}],
      markers: [{x:35,y:25,type:"double_test"},{x:65,y:25,type:"double_test"},{x:80,y:50,type:"structure_shift"}],
    },
  },
  {
    nameJa: "ダブルボトム → 反転",
    nameEn: "Double Bottom → Reversal",
    slug: "double-bottom-reversal",
    familySlug: "reversal",
    familyName: "REVERSAL",
    descriptionJa: "同じ安値付近を2回つけて反転する型",
    descriptionEn: "Price tests the same low twice and reverses.",
    stateSequence: ["approach_down", "first_bottom", "bounce", "second_bottom", "double_test", "structure_shift", "upside_expansion"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:20},{x:20,y:60},{x:35,y:75},{x:50,y:55},{x:65,y:75},{x:80,y:50},{x:100,y:20}],
      levels: [{y:75,type:"support"}],
      markers: [{x:35,y:75,type:"double_test"},{x:65,y:75,type:"double_test"},{x:80,y:50,type:"structure_shift"}],
    },
  },
  {
    nameJa: "切り上げ継続",
    nameEn: "Higher Low → Continuation",
    slug: "higher-low-continuation",
    familySlug: "trend-continuation",
    familyName: "TREND CONTINUATION",
    descriptionJa: "押し目が切り上がりながらトレンドが継続する型",
    descriptionEn: "An uptrend continues as pullbacks form higher lows.",
    stateSequence: ["uptrend", "pullback", "higher_low", "expansion_up"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:80},{x:20,y:55},{x:35,y:65},{x:50,y:35},{x:65,y:48},{x:80,y:20},{x:100,y:8}],
      levels: [],
      markers: [{x:35,y:65,type:"structure_shift"},{x:65,y:48,type:"structure_shift"},{x:100,y:8,type:"expansion"}],
    },
  },
  {
    nameJa: "切り下げ継続",
    nameEn: "Lower High → Continuation",
    slug: "lower-high-continuation",
    familySlug: "trend-continuation",
    familyName: "TREND CONTINUATION",
    descriptionJa: "戻りが切り下がりながら下降トレンドが継続する型",
    descriptionEn: "A downtrend continues as rallies form lower highs.",
    stateSequence: ["downtrend", "pullback", "lower_high", "expansion_down"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:20},{x:20,y:45},{x:35,y:35},{x:50,y:65},{x:65,y:52},{x:80,y:80},{x:100,y:92}],
      levels: [],
      markers: [{x:35,y:35,type:"structure_shift"},{x:65,y:52,type:"structure_shift"},{x:100,y:92,type:"expansion"}],
    },
  },
  {
    nameJa: "継続失敗",
    nameEn: "Failed Continuation",
    slug: "failed-continuation",
    familySlug: "failed-continuation",
    familyName: "FAILED CONTINUATION",
    descriptionJa: "トレンド継続を狙ったが失敗しレンジ・反転した型",
    descriptionEn: "A continuation attempt fails and price ranges or reverses instead.",
    stateSequence: ["uptrend", "pullback", "failed_followthrough", "range"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:80},{x:25,y:45},{x:45,y:55},{x:60,y:40},{x:75,y:55},{x:100,y:48}],
      levels: [{y:48,type:"resistance"}],
      markers: [{x:60,y:40,type:"failed_breakout"}],
    },
  },
  {
    nameJa: "レンジブレイク",
    nameEn: "Range Breakout",
    slug: "range-breakout",
    familySlug: "range",
    familyName: "RANGE",
    descriptionJa: "レンジ相場からの明確なブレイクアウトで加速する型",
    descriptionEn: "Price breaks decisively out of a range and accelerates.",
    stateSequence: ["range", "compression", "breakout", "expansion"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:55},{x:20,y:45},{x:35,y:58},{x:50,y:48},{x:65,y:52},{x:80,y:30},{x:100,y:8}],
      levels: [{y:45,type:"resistance"},{y:58,type:"support"}],
      markers: [{x:80,y:30,type:"breakout"},{x:100,y:8,type:"expansion"}],
    },
  },
  {
    nameJa: "サポート反発",
    nameEn: "Support Rejection",
    slug: "support-rejection",
    familySlug: "level-reaction",
    familyName: "LEVEL REACTION",
    descriptionJa: "重要サポートへ到達して反発する型",
    descriptionEn: "Price reaches a key support level and bounces.",
    stateSequence: ["approach_down", "test_support", "rejection", "expansion_up"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:20},{x:30,y:50},{x:50,y:72},{x:70,y:55},{x:100,y:25}],
      levels: [{y:72,type:"support"}],
      markers: [{x:50,y:72,type:"rejection"}],
    },
  },
  {
    nameJa: "レジスタンス反発",
    nameEn: "Resistance Rejection",
    slug: "resistance-rejection",
    familySlug: "level-reaction",
    familyName: "LEVEL REACTION",
    descriptionJa: "重要レジスタンスへ到達して反落する型",
    descriptionEn: "Price reaches a key resistance level and rejects lower.",
    stateSequence: ["approach_up", "test_resistance", "rejection", "expansion_down"],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:80},{x:30,y:50},{x:50,y:28},{x:70,y:45},{x:100,y:75}],
      levels: [{y:28,type:"resistance"}],
      markers: [{x:50,y:28,type:"rejection"}],
    },
  },
  {
    nameJa: "UNCLASSIFIED",
    nameEn: "Unclassified",
    slug: "unclassified",
    familySlug: null,
    familyName: null,
    descriptionJa: "まだPatternに分類されていないCase",
    descriptionEn: "A case not yet classified into a Pattern.",
    stateSequence: [],
    icon: {
      version: 1, viewBox: [0, 0, 100, 100],
      pricePath: [{x:0,y:50},{x:50,y:50},{x:100,y:50}],
      levels: [],
      markers: [],
    },
  },
];

async function main() {
  for (const p of patterns) {
    await upsertPattern(p);
  }
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
