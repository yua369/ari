// §149 Recently Viewed: 3〜6件、per-browser（localStorage）。DB変更なしの軽量実装。
export type RecentlyViewedPattern = {
  id: string;
  nameJa: string;
  nameEn: string;
  iconDefinition: string;
};

const KEY = "fxpm_recently_viewed_patterns";
const MAX = 6;

export function recordRecentlyViewedPattern(pattern: RecentlyViewedPattern) {
  try {
    const current = readRecentlyViewedPatterns().filter((p) => p.id !== pattern.id);
    const next = [pattern, ...current].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // noop: private browsing / storage disabled
  }
}

export function readRecentlyViewedPatterns(): RecentlyViewedPattern[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
