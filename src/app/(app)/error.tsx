"use client";

import { useEffect } from "react";
import Link from "next/link";

// §48 Error Boundary: 一部Componentのエラーで画面全体がWhite Screenにならないようにする。Retry可能。
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // サーバーログにも残るが、クライアント側でも最低限記録しておく（機微情報は出さない）
    console.error("App error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-lg font-bold">問題が発生しました</p>
      <p className="text-dim text-sm max-w-sm">
        一時的なエラーが発生しました。入力していた内容は失われていない場合があります。もう一度お試しください。
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          再試行
        </button>
        <Link href="/" className="btn">
          HOMEへ戻る
        </Link>
      </div>
      {error.digest && <p className="text-faint text-[0.65rem] mono">ref: {error.digest}</p>}
    </div>
  );
}
