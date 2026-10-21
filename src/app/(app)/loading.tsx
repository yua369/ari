// §45 Loading State: ページ遷移中に無反応に見えないよう最小限のSkeletonを出す。
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-6 w-40 rounded surface-2" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded surface-2" />
        ))}
      </div>
    </div>
  );
}
