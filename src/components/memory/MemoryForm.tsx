"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createMemoryAction, updateMemoryAction, removeChartImageAction } from "@/lib/actions/memory";
import { unlinkPatternFromMemoryAction } from "@/lib/actions/pattern";
import { CopyPromptButton } from "@/components/memory/CopyPromptButton";
import { PatternPicker, type PatternPickerValue } from "@/components/pattern/PatternPicker";
import { t, type Locale } from "@/lib/i18n";
import { saveDraftImages, loadDraftImages, clearDraftImages } from "@/lib/draftImages";
import { validateImageFile } from "@/lib/imageValidation";

type ImageItem = { file: File; previewUrl: string; role: "ENTRY" | "AFTER" };

const DRAFT_KEY = "fxpm-add-case-draft";

type Draft = {
  symbol: string;
  timeframe: string;
  occurredAt: string;
  direction: string;
  outcome: string;
  chatgptRawAnalysis: string;
  myNote: string;
  savedAt: number;
};

export type ExistingMemory = {
  id: string;
  symbol: string;
  occurredAt: string;
  title: string;
  patternName: string;
  summary: string;
  direction: string;
  outcome: string;
  processQuality: string;
  rMultiple: string;
  chatgptRawAnalysis: string;
  entryReason: string;
  invalidation: string;
  lesson: string;
  visibility: string;
  myNote: string;
  patterns: { patternId: string; patternName: string; caseType: string }[];
  images: { id: string; role: "ENTRY" | "AFTER" | "EXIT" | "CONTEXT"; timeframe: string }[];
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="text-faint text-xs mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

// §29 Edit Case: 既存画像もここに表示し、個別に削除できる（置き換えは削除+再アップロードで実現）。
function ImageDropZone({
  images,
  existingImages,
  onAdd,
  onRemove,
  onRemoveExisting,
}: {
  images: ImageItem[];
  existingImages?: { id: string; thumbUrl: string }[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onRemoveExisting?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input type="file" accept="image/*" multiple onChange={(e) => onAdd(e.target.files)} className="text-xs text-dim" />
      {((existingImages && existingImages.length > 0) || images.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          {existingImages?.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl} alt="" className="rounded aspect-video object-cover w-full" />
              <button
                type="button"
                className="absolute top-1 right-1 btn btn-danger !px-1.5 !py-0.5 !text-[0.65rem]"
                onClick={() => onRemoveExisting?.(img.id)}
              >
                ×
              </button>
            </div>
          ))}
          {images.map((img, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="" className="rounded aspect-video object-cover w-full" />
              <button
                type="button"
                className="absolute top-1 right-1 btn btn-danger !px-1.5 !py-0.5 !text-[0.65rem]"
                onClick={() => onRemove(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MemoryForm({ existing, locale }: { existing?: ExistingMemory; locale: Locale }) {
  const isEdit = Boolean(existing);
  const tt = (key: Parameters<typeof t>[1]) => t(locale, key);

  const [entryImages, setEntryImages] = useState<ImageItem[]>([]);
  const [afterImages, setAfterImages] = useState<ImageItem[]>([]);
  const [existingEntryImages, setExistingEntryImages] = useState(
    (existing?.images ?? []).filter((i) => i.role === "ENTRY")
  );
  const [existingAfterImages, setExistingAfterImages] = useState(
    (existing?.images ?? []).filter((i) => i.role === "AFTER")
  );
  const didLoadImageDraft = useRef(false);

  const [symbol, setSymbol] = useState(existing?.symbol ?? "XAUUSD");
  const [timeframe, setTimeframe] = useState(existing?.images[0]?.timeframe ?? "H1");
  const [occurredAt, setOccurredAt] = useState(existing?.occurredAt ?? "");
  const [direction, setDirection] = useState(existing?.direction ?? "WAIT");
  const [outcome, setOutcome] = useState(existing?.outcome ?? "UNKNOWN");
  const [chatgptRawAnalysis, setChatgptRawAnalysis] = useState(existing?.chatgptRawAnalysis ?? "");
  const [myNote, setMyNote] = useState(existing?.myNote ?? "");
  const [patternValue, setPatternValue] = useState<PatternPickerValue>({
    patternId: existing?.patterns[0]?.patternId ?? null,
    newCandidateName: "",
    newCandidateDescription: "",
  });

  // Advanced（任意）
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [processQuality, setProcessQuality] = useState(existing?.processQuality ?? "UNRATED");
  const [rMultiple, setRMultiple] = useState(existing?.rMultiple ?? "");
  const [entryReason, setEntryReason] = useState(existing?.entryReason ?? "");
  const [invalidation, setInvalidation] = useState(existing?.invalidation ?? "");
  const [lesson, setLesson] = useState(existing?.lesson ?? "");
  const [visibility, setVisibility] = useState(existing?.visibility ?? "PRIVATE");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftRestored, setDraftRestored] = useState(false);

  // §15-17/§65 Draft自動保存: ChatGPTへ移動して戻ってきても（別タブでもReloadでも）消えないこと。
  // テキストはlocalStorage、画像(File)はIndexedDBへ保存する（§92 Launch Blocker: 画像消失の防止）。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEdit) return;
    let textRestored = false;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (draft.chatgptRawAnalysis || draft.symbol) {
          setSymbol(draft.symbol || "XAUUSD");
          setTimeframe(draft.timeframe || "H1");
          setOccurredAt(draft.occurredAt || "");
          setDirection(draft.direction || "WAIT");
          setOutcome(draft.outcome || "UNKNOWN");
          setChatgptRawAnalysis(draft.chatgptRawAnalysis || "");
          setMyNote(draft.myNote || "");
          textRestored = true;
        }
      }
    } catch {
      // 壊れたdraftは無視
    }

    loadDraftImages().then((images) => {
      if (images.length === 0) {
        if (textRestored) setDraftRestored(true);
        return;
      }
      const entry = images.filter((i) => i.role === "ENTRY").map((i) => ({ file: i.file, previewUrl: URL.createObjectURL(i.file), role: i.role }));
      const after = images.filter((i) => i.role === "AFTER").map((i) => ({ file: i.file, previewUrl: URL.createObjectURL(i.file), role: i.role }));
      if (entry.length > 0) setEntryImages(entry);
      if (after.length > 0) setAfterImages(after);
      didLoadImageDraft.current = true;
      setDraftRestored(true);
    });
  }, [isEdit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isEdit) return;
    const draft: Draft = { symbol, timeframe, occurredAt, direction, outcome, chatgptRawAnalysis, myNote, savedAt: Date.now() };
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // noop
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [isEdit, symbol, timeframe, occurredAt, direction, outcome, chatgptRawAnalysis, myNote]);

  // 画像Draftの保存。初回ロード直後（復元した画像をそのまま書き戻すだけ）はスキップする。
  useEffect(() => {
    if (isEdit) return;
    if (didLoadImageDraft.current) {
      didLoadImageDraft.current = false;
      return;
    }
    const all = [...entryImages, ...afterImages].map((img) => ({ file: img.file, role: img.role }));
    const timer = setTimeout(() => {
      if (all.length > 0) void saveDraftImages(all);
      else void clearDraftImages();
    }, 300);
    return () => clearTimeout(timer);
  }, [isEdit, entryImages, afterImages]);

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // noop
    }
    void clearDraftImages();
  }

  function removeExistingImage(imageId: string, role: "ENTRY" | "AFTER") {
    const setter = role === "ENTRY" ? setExistingEntryImages : setExistingAfterImages;
    setter((prev) => prev.filter((img) => img.id !== imageId));
    startTransition(() => {
      void removeChartImageAction(imageId);
    });
  }

  // §13-14 Upload Test Matrix: 不正ファイル/サイズ超過はここで即座に弾く（サーバーでも二重チェックする）。
  function addImages(setter: typeof setEntryImages, role: "ENTRY" | "AFTER") {
    return (fileList: FileList | null) => {
      if (!fileList) return;
      const accepted: ImageItem[] = [];
      for (const file of Array.from(fileList)) {
        const invalid = validateImageFile(file);
        if (invalid) {
          const key = invalid.code === "TOO_LARGE" ? "error.imageTooLarge" : invalid.code === "EMPTY" ? "error.imageEmpty" : "error.imageInvalidType";
          setError(`${tt(key)} ${invalid.fileName}`);
          continue;
        }
        accepted.push({ file, previewUrl: URL.createObjectURL(file), role });
      }
      if (accepted.length > 0) {
        setError(null);
        setter((prev) => [...prev, ...accepted]);
      }
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const totalEntryImages = entryImages.length + existingEntryImages.length;
    if (totalEntryImages === 0) {
      setError(tt("case.entryRequired"));
      return;
    }

    const fd = new FormData();
    fd.set("symbol", symbol);
    fd.set("occurredAt", occurredAt || new Date().toISOString().slice(0, 16));
    fd.set("title", patternValue.newCandidateName || `${symbol} Case`);
    fd.set("patternName", patternValue.newCandidateName || "UNCLASSIFIED");
    fd.set("summary", summary);
    fd.set("direction", direction);
    fd.set("outcome", outcome);
    fd.set("processQuality", processQuality);
    fd.set("rMultiple", rMultiple);
    fd.set("chatgptRawAnalysis", chatgptRawAnalysis);
    fd.set("entryReason", entryReason);
    fd.set("invalidation", invalidation);
    fd.set("lesson", lesson);
    fd.set("myNote", myNote);
    fd.set("visibility", visibility);
    if (patternValue.patternId) fd.set("patternId", patternValue.patternId);
    if (patternValue.newCandidateName) {
      fd.set("newCandidateName", patternValue.newCandidateName);
      fd.set("newCandidateDescription", patternValue.newCandidateDescription);
    }

    const allImages = [...entryImages, ...afterImages];
    const imageMeta = allImages.map((img) => ({ timeframe, role: img.role, storyOrder: 0 }));
    fd.set("imageMeta", JSON.stringify(imageMeta));
    allImages.forEach((img) => fd.append("images", img.file));

    startTransition(async () => {
      try {
        if (isEdit && existing) {
          await updateMemoryAction(existing.id, fd);
        } else {
          await createMemoryAction(fd);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          clearDraft();
          return;
        }
        setError(err instanceof Error ? err.message : tt("error.default"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-40 sm:pb-24">
      {draftRestored && (
        <div className="surface p-3 flex items-center justify-between gap-3 text-xs" style={{ borderColor: "var(--accent)" }}>
          <span className="text-dim">{tt("case.draftRestored")}</span>
          <button
            type="button"
            className="btn !text-xs"
            onClick={() => {
              clearDraft();
              setEntryImages([]);
              setAfterImages([]);
              setDraftRestored(false);
            }}
          >
            {tt("case.discardDraft")}
          </button>
        </div>
      )}

      <Section title={tt("case.step1")} description={tt("case.step1desc")}>
        <ImageDropZone
          images={entryImages}
          existingImages={isEdit ? existingEntryImages.map((img) => ({ id: img.id, thumbUrl: `/api/images/${img.id}/thumb` })) : undefined}
          onAdd={addImages(setEntryImages, "ENTRY")}
          onRemove={(i) => setEntryImages((prev) => prev.filter((_, idx) => idx !== i))}
          onRemoveExisting={(id) => removeExistingImage(id, "ENTRY")}
        />
      </Section>

      <Section title={tt("case.step2")} description={tt("case.step2desc")}>
        <ImageDropZone
          images={afterImages}
          existingImages={isEdit ? existingAfterImages.map((img) => ({ id: img.id, thumbUrl: `/api/images/${img.id}/thumb` })) : undefined}
          onAdd={addImages(setAfterImages, "AFTER")}
          onRemove={(i) => setAfterImages((prev) => prev.filter((_, idx) => idx !== i))}
          onRemoveExisting={(id) => removeExistingImage(id, "AFTER")}
        />
      </Section>

      <Section title={tt("case.step3")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label={tt("case.symbol")}>
            <input className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
          </Field>
          <Field label={tt("case.timeframe")}>
            <select className="input" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              {["D1", "H4", "H1", "M30", "M15", "M5", "M1"].map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tt("case.date")}>
            <input type="datetime-local" className="input" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </Field>
          <Field label={tt("case.direction")}>
            <select className="input" value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="LONG">{tt("direction.LONG")}</option>
              <option value="SHORT">{tt("direction.SHORT")}</option>
              <option value="WAIT">{tt("direction.WAIT")}</option>
              <option value="MIXED">{tt("direction.MIXED")}</option>
            </select>
          </Field>
          <Field label={tt("case.result")}>
            <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="UNKNOWN">{tt("result.UNKNOWN")}</option>
              <option value="WORKED">{tt("result.WORKED")}</option>
              <option value="FAILED">{tt("result.FAILED")}</option>
              <option value="BREAKEVEN">{tt("result.BREAKEVEN")}</option>
              <option value="INVALIDATED">{tt("result.INVALIDATED")}</option>
              <option value="NO_TRADE">{tt("result.NO_TRADE")}</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title={tt("case.step4")} description={tt("case.step4desc")}>
        <ol className="text-xs text-dim flex flex-col gap-1.5 list-decimal list-inside">
          <li>{tt("case.step4_1")}</li>
          <li>{tt("case.step4_2")}</li>
          <li>
            <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--accent)" }}>
              {tt("case.step4_3a")}
            </a>{" "}
            {tt("case.step4_3b")}
          </li>
          <li>{tt("case.step4_4")}</li>
          <li>{tt("case.step4_5")}</li>
        </ol>
        <CopyPromptButton locale={locale} label={tt("case.copyPrompt")} copiedLabel={tt("case.copied")} />
        <Field label={tt("case.analysisLabel")}>
          <textarea className="input" rows={8} value={chatgptRawAnalysis} onChange={(e) => setChatgptRawAnalysis(e.target.value)} />
        </Field>
      </Section>

      <Section title={tt("case.step5")} description={tt("case.step5desc")}>
        <PatternPicker value={patternValue} onChange={setPatternValue} locale={locale} />
      </Section>

      <Section title={tt("case.step6")} description={tt("case.optional")}>
        <textarea className="input" rows={2} value={myNote} onChange={(e) => setMyNote(e.target.value)} />
      </Section>

      <details className="surface p-4 sm:p-5">
        <summary className="section-title cursor-pointer select-none">{tt("case.advanced")}</summary>
        <div className="flex flex-col gap-5 mt-4">
          <Field label={tt("case.summary")}>
            <textarea className="input" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label={tt("case.processQuality")}>
              <select className="input" value={processQuality} onChange={(e) => setProcessQuality(e.target.value)}>
                <option value="UNRATED">—</option>
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="NEUTRAL">NEUTRAL</option>
                <option value="POOR">POOR</option>
              </select>
            </Field>
            <Field label={tt("case.rMultiple")}>
              <input className="input" type="number" step="0.1" value={rMultiple} onChange={(e) => setRMultiple(e.target.value)} />
            </Field>
            <Field label={tt("case.visibility")}>
              <select
                className="input"
                value={visibility}
                onChange={(e) => {
                  const next = e.target.value;
                  // §60 Publication Confirmation: PRIVATE→PUBLICへの切替は公開範囲が変わるため必ず確認する
                  if (next === "PUBLIC" && visibility !== "PUBLIC" && !window.confirm(tt("case.publishConfirm"))) {
                    return;
                  }
                  setVisibility(next);
                }}
              >
                <option value="PRIVATE">{tt("case.private")}</option>
                <option value="PUBLIC">{tt("case.public")}</option>
              </select>
            </Field>
          </div>
          <Field label={tt("case.entryReason")}>
            <textarea className="input" rows={2} value={entryReason} onChange={(e) => setEntryReason(e.target.value)} />
          </Field>
          <Field label={tt("case.invalidation")}>
            <textarea className="input" rows={2} value={invalidation} onChange={(e) => setInvalidation(e.target.value)} />
          </Field>
          <Field label={tt("case.lesson")}>
            <textarea className="input" rows={2} value={lesson} onChange={(e) => setLesson(e.target.value)} />
          </Field>
        </div>
      </details>

      {isEdit && existing && existing.patterns.length > 0 && (
        <Section title={tt("case.pattern")}>
          <div className="flex flex-wrap gap-2">
            {existing.patterns.map((l) => (
              <span key={l.patternId} className="badge">
                {l.patternName} ({l.caseType})
                <button type="button" className="text-faint hover:text-[var(--text)]" onClick={() => unlinkPatternFromMemoryAction(existing.id, l.patternId)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </Section>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--tag-amber)" }}>
          {error}
        </p>
      )}

      {/* §175 Sticky Nav: MobileのBottom Navigation(高さ約64px、safe-areaはNav側で確保済み)と重ならないよう、Save Barはその上に重ねる */}
      <div
        className="fixed bottom-16 sm:bottom-0 left-0 right-0 px-4 py-3 flex justify-end gap-2"
        style={{ background: "rgba(11,12,14,0.9)", borderTop: "1px solid var(--border)" }}
      >
        <div className="w-full max-w-6xl mx-auto flex justify-end gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? `${tt("common.loading")}` : isEdit ? tt("case.save") : tt("case.saveNew")}
          </button>
        </div>
      </div>
    </form>
  );
}
