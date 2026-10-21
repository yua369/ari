// §63(fx-analysis-memoryより移植) Export: いつでも自分のデータをJSON/Markdownとして持ち出せる。
export function ExportButtons({ memoryId, jsonLabel, mdLabel }: { memoryId: string; jsonLabel: string; mdLabel: string }) {
  return (
    <div className="flex items-center gap-1">
      <a href={`/api/memories/${memoryId}/export?format=json`} className="btn !text-xs">
        {jsonLabel}
      </a>
      <a href={`/api/memories/${memoryId}/export?format=md`} className="btn !text-xs">
        {mdLabel}
      </a>
    </div>
  );
}
