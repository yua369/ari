import Link from "next/link";

// §47 Error Handling: 404も意味不明な技術Errorではなく、次の行動が分かるUIにする。
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-lg font-bold">404</p>
      <p className="text-dim text-sm max-w-sm">
        お探しのページは見つかりませんでした。削除されたか、非公開（PRIVATE）の可能性があります。
      </p>
      <div className="flex gap-2">
        <Link href="/" className="btn btn-primary">
          HOMEへ戻る
        </Link>
        <Link href="/patterns" className="btn">
          PATTERNSを見る
        </Link>
      </div>
    </div>
  );
}
