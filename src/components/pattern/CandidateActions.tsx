"use client";

import { useState, useTransition } from "react";
import { resolveCandidateAsExistingAction, rejectCandidateAction, adminCreatePatternAction } from "@/lib/actions/pattern";

export function CandidateActions({
  candidateId,
  suggestedName,
  existingPatterns,
}: {
  candidateId: string;
  suggestedName: string;
  existingPatterns: { id: string; nameJa: string }[];
}) {
  const [mode, setMode] = useState<"idle" | "existing" | "new">("idle");
  const [existingId, setExistingId] = useState("");
  const [family, setFamily] = useState("");
  const [pending, startTransition] = useTransition();

  if (mode === "existing") {
    return (
      <div className="flex gap-2">
        <select className="input !text-xs" value={existingId} onChange={(e) => setExistingId(e.target.value)}>
          <option value="">Patternを選択…</option>
          {existingPatterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameJa}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary !text-xs"
          disabled={!existingId || pending}
          onClick={() => startTransition(() => resolveCandidateAsExistingAction(candidateId, existingId))}
        >
          確定
        </button>
        <button type="button" className="btn !text-xs" onClick={() => setMode("idle")}>
          やめる
        </button>
      </div>
    );
  }

  if (mode === "new") {
    return (
      <form
        action={(fd) => {
          fd.set("nameJa", suggestedName);
          fd.set("family", family);
          fd.set("resolvedCandidateId", candidateId);
          startTransition(() => {
            void adminCreatePatternAction(fd);
          });
        }}
        className="flex gap-2"
      >
        <input className="input !text-xs" placeholder="Family（例: FAILED BREAKOUT）" value={family} onChange={(e) => setFamily(e.target.value)} />
        <button type="submit" disabled={pending} className="btn btn-primary !text-xs">
          新規Patternとして登録
        </button>
        <button type="button" className="btn !text-xs" onClick={() => setMode("idle")}>
          やめる
        </button>
      </form>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button type="button" className="btn !text-xs" onClick={() => setMode("existing")}>
        既存Patternとして解決
      </button>
      <button type="button" className="btn btn-primary !text-xs" onClick={() => setMode("new")}>
        新規Patternとして登録
      </button>
      <button
        type="button"
        className="btn btn-danger !text-xs"
        disabled={pending}
        onClick={() => startTransition(() => rejectCandidateAction(candidateId, "重複または不適切"))}
      >
        却下
      </button>
    </div>
  );
}
