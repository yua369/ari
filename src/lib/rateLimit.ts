// §57 Rate Limit: 最低限の連打対策。単一プロセスのインメモリ実装（複数インスタンス構成では共有されない点に注意——
// 本格運用時はRedis等へ置き換える）。過剰実装はしない。

import "server-only";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// 古いエントリの無制限増加を防ぐための簡易GC
function gc(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * key単位でwindowMs内にlimit回を超えたらtrueを返す（=制限超過）。
 * 例: checkRateLimit(`login:${ip}:${username}`, 10, 5 * 60 * 1000)
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  gc(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
