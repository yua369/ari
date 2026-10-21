"use client";

import { useMemo, useState, useTransition } from "react";
import { submitPatternCandidateAction, findSimilarPatternsAction } from "@/lib/actions/pattern";
import { generateIconFromStateSequence, iconDefinitionSchema, type IconDefinition } from "@/lib/pattern-icon";
import { PatternIcon } from "@/components/pattern/PatternIcon";

export function PatternCandidateForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sequence, setSequence] = useState<string[]>([""]);
  const [iconMode, setIconMode] = useState<"generate" | "custom">("generate");
  const [iconJson, setIconJson] = useState("");
  const [similar, setSimilar] = useState<{ id: string; nameJa: string; nameEn: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cleanSequence = sequence.map((s) => s.trim()).filter(Boolean);
  const cleanSequenceKey = cleanSequence.join("|");

  const previewIcon: IconDefinition | null = useMemo(() => {
    if (iconMode === "generate") {
      return generateIconFromStateSequence(cleanSequence.length > 0 ? cleanSequence : [name || "pattern"]);
    }
    try {
      return iconDefinitionSchema.parse(JSON.parse(iconJson));
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconMode, iconJson, cleanSequenceKey, name]);

  async function checkSimilar(value: string) {
    setName(value);
    if (value.trim().length < 2) {
      setSimilar([]);
      return;
    }
    const results = await findSimilarPatternsAction(value);
    setSimilar(results);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("stateSequence", JSON.stringify(cleanSequence));
    fd.set("iconMode", iconMode);
    fd.set("iconJson", iconJson);

    startTransition(async () => {
      try {
        await submitPatternCandidateAction(fd);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setError(err instanceof Error ? err.message : "送信に失敗しました");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-24">
      <div className="surface p-4 sm:p-5 flex flex-col gap-4">
        <div>
          <h2 className="section-title">この形は何という名前ですか？</h2>
          <p className="text-faint text-xs mt-1">
            送信すると管理者が確認し、既存Patternのエイリアス・Variant・新規Patternのいずれかとして登録されます（§31-32 重複防止）。
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Pattern候補名</label>
          <input className="input" placeholder="例: 上抜け失敗 → 反落" value={name} onChange={(e) => checkSimilar(e.target.value)} required />
        </div>
        {similar.length > 0 && (
          <div className="surface-2 p-3 text-xs flex flex-col gap-1.5">
            <p className="text-faint">似た名前の既存Patternがあります。先にこちらを確認してください:</p>
            {similar.map((s) => (
              <a key={s.id} href={`/patterns/${s.id}`} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--accent)" }}>
                {s.nameJa}（{s.nameEn}）
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="field-label">説明（1行）</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="surface p-4 sm:p-5 flex flex-col gap-4">
        <h2 className="section-title">STATE SEQUENCE（値動きの構造キーワード）</h2>
        <div className="flex flex-col gap-2">
          {sequence.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                placeholder="例: strong_approach_up, test_resistance, failed_followthrough..."
                value={s}
                onChange={(e) => {
                  const next = [...sequence];
                  next[i] = e.target.value;
                  setSequence(next);
                }}
              />
              <button type="button" className="btn btn-danger !px-2 !text-xs shrink-0" onClick={() => setSequence((prev) => prev.filter((_, idx) => idx !== i))}>
                削除
              </button>
            </div>
          ))}
          <button type="button" className="btn !self-start !text-xs" onClick={() => setSequence((prev) => [...prev, ""])}>
            + 追加
          </button>
        </div>
      </div>

      <div className="surface p-4 sm:p-5 flex flex-col gap-4">
        <h2 className="section-title">ICON PREVIEW</h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={iconMode === "generate"} onChange={() => setIconMode("generate")} />
            自動生成
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={iconMode === "custom"} onChange={() => setIconMode("custom")} />
            JSON直接指定
          </label>
        </div>
        {iconMode === "custom" && (
          <textarea className="input font-mono" rows={6} value={iconJson} onChange={(e) => setIconJson(e.target.value)} />
        )}
        <div className="w-28 h-28 surface-2 p-3">
          {previewIcon ? <PatternIcon icon={previewIcon} title="preview" className="w-full h-full" /> : <div className="text-faint text-xs">invalid JSON</div>}
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--tag-amber)" }}>
          {error}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 flex justify-end gap-2" style={{ background: "rgba(11,12,14,0.9)", borderTop: "1px solid var(--border)" }}>
        <div className="w-full max-w-6xl mx-auto flex justify-end gap-2">
          <button type="submit" disabled={pending || !name} className="btn btn-primary">
            {pending ? "送信中..." : "候補として送信"}
          </button>
        </div>
      </div>
    </form>
  );
}
