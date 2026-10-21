"use client";

import { useEffect } from "react";
import { recordRecentlyViewedPattern } from "@/lib/recentlyViewed";

// Pattern Detailを開いた記録をlocalStorageへ残す。表示は持たない(side-effectのみ)。
export function RecentlyViewedTracker({ id, nameJa, nameEn, iconDefinition }: { id: string; nameJa: string; nameEn: string; iconDefinition: string }) {
  useEffect(() => {
    recordRecentlyViewedPattern({ id, nameJa, nameEn, iconDefinition });
  }, [id, nameJa, nameEn, iconDefinition]);
  return null;
}
