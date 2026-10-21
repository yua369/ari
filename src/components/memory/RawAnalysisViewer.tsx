"use client";

import { useState } from "react";

type Revision = { id: string; content: string; createdAt: string };

// §05/§84(fx-analysis-memoryより移植) Immutable Raw Data: ChatGPTが書いた原文をそのまま確認できることを保証する。
// サイト側は要約・訂正しない。上書き時の旧版はMemoryRevisionへ退避済みのため、ここで履歴として開ける。
export function RawAnalysisViewer({
  title,
  subtitle,
  content,
  revisions,
  historyLabel,
  historyHideLabel,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  content: string;
  revisions: Revision[];
  historyLabel: string;
  historyHideLabel: string;
  emptyLabel: string;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="text-faint text-xs mt-0.5">{subtitle}</p>
        </div>
        {revisions.length > 0 && (
          <button type="button" className="btn !text-xs" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? historyHideLabel : `${historyLabel}（${revisions.length}）`}
          </button>
        )}
      </div>
      <div className="surface-2 p-4">
        <pre className="text-sm text-dim whitespace-pre-wrap font-sans leading-relaxed">{content || emptyLabel}</pre>
      </div>
      {showHistory && (
        <div className="flex flex-col gap-2">
          {revisions.map((r) => (
            <div key={r.id} className="surface-2 p-3">
              <p className="text-faint text-xs mono mb-1.5">{r.createdAt.slice(0, 16).replace("T", " ")}</p>
              <pre className="text-xs text-faint whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
