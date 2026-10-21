type SearchableMemory = {
  title: string;
  patternName: string;
  summary: string;
  symbol: string;
  chatgptRawAnalysis?: string | null;
  entryReason?: string | null;
  invalidation?: string | null;
  lesson?: string | null;
  patterns?: { pattern: { nameJa: string; nameEn: string; aliases: { alias: string }[] } }[];
};

// §38 検索対象: Pattern / Alias / Symbol / Analysis / Lesson 等を1本のテキストへ結合する。
export function buildSearchText(memory: SearchableMemory): string {
  const parts: string[] = [memory.title, memory.patternName, memory.summary, memory.symbol];
  if (memory.chatgptRawAnalysis) parts.push(memory.chatgptRawAnalysis);
  if (memory.entryReason) parts.push(memory.entryReason);
  if (memory.invalidation) parts.push(memory.invalidation);
  if (memory.lesson) parts.push(memory.lesson);
  if (memory.patterns) {
    for (const mp of memory.patterns) {
      parts.push(mp.pattern.nameJa, mp.pattern.nameEn);
      parts.push(...mp.pattern.aliases.map((a) => a.alias));
    }
  }
  return parts.filter(Boolean).join(" \n ");
}
