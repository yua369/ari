"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMemoryAction,
  toggleSaveMemoryAction,
  reportMemoryAction,
  restoreMemoryAction,
  permanentlyDeleteMemoryAction,
} from "@/lib/actions/memory";
import type { Locale } from "@/lib/i18n";

export function SaveMemoryButton({
  memoryId,
  initialSaved,
  initialCount,
  viewerExists,
  label = "保存",
}: {
  memoryId: string;
  initialSaved: boolean;
  initialCount: number;
  viewerExists: boolean;
  label?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!viewerExists) {
    return (
      <button type="button" className="btn !text-xs" onClick={() => router.push("/login")}>
        ☆ {label}（{count}）
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      className="btn !text-xs"
      onClick={() =>
        startTransition(async () => {
          setSaved(!saved);
          setCount((c) => (saved ? c - 1 : c + 1));
          await toggleSaveMemoryAction(memoryId);
        })
      }
    >
      {saved ? "★" : "☆"} {label}（{count}）
    </button>
  );
}

export function DeleteMemoryButton({
  memoryId,
  label = "削除",
  confirmText = "ゴミ箱へ移動します（復元可能）",
  confirmBtn = "削除する",
  cancelBtn = "やめる",
}: {
  memoryId: string;
  label?: string;
  confirmText?: string;
  confirmBtn?: string;
  cancelBtn?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger !text-xs" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-dim">{confirmText}</span>
      <button type="button" disabled={pending} className="btn btn-danger !text-xs" onClick={() => startTransition(() => deleteMemoryAction(memoryId))}>
        {confirmBtn}
      </button>
      <button type="button" className="btn !text-xs" onClick={() => setConfirming(false)}>
        {cancelBtn}
      </button>
    </div>
  );
}

export function RestoreMemoryButton({ memoryId, label = "復元する", pendingLabel = "復元中..." }: { memoryId: string; label?: string; pendingLabel?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn !text-xs" onClick={() => startTransition(() => restoreMemoryAction(memoryId))}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function PermanentlyDeleteButton({
  memoryId,
  label = "完全に削除",
  warning = "元画像も含めて復元不可能になります",
  confirmBtn = "本当に削除する",
  cancelBtn = "やめる",
}: {
  memoryId: string;
  label?: string;
  warning?: string;
  confirmBtn?: string;
  cancelBtn?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger !text-xs" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <span style={{ color: "var(--tag-amber)" }}>{warning}</span>
      <div className="flex gap-2">
        <button type="button" disabled={pending} className="btn btn-danger !text-xs" onClick={() => startTransition(() => permanentlyDeleteMemoryAction(memoryId))}>
          {confirmBtn}
        </button>
        <button type="button" className="btn !text-xs" onClick={() => setConfirming(false)}>
          {cancelBtn}
        </button>
      </div>
    </div>
  );
}

const REASONS_JA = [
  ["SPAM", "スパム"],
  ["MISLEADING", "誤解を招く内容"],
  ["STOLEN_CONTENT", "盗用コンテンツ"],
  ["HARASSMENT", "嫌がらせ"],
  ["ADVERTISEMENT", "広告"],
  ["COPYRIGHT", "著作権侵害"],
  ["OTHER", "その他"],
] as const;

const REASONS_EN = [
  ["SPAM", "Spam"],
  ["MISLEADING", "Misleading"],
  ["STOLEN_CONTENT", "Stolen content"],
  ["HARASSMENT", "Harassment"],
  ["ADVERTISEMENT", "Advertisement"],
  ["COPYRIGHT", "Copyright"],
  ["OTHER", "Other"],
] as const;

export function ReportButton({ memoryId, label = "通報", sentLabel = "通報しました", locale = "ja" }: { memoryId: string; label?: string; sentLabel?: string; locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("SPAM");
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const reasons = locale === "en" ? REASONS_EN : REASONS_JA;

  if (sent) {
    return <span className="text-faint text-xs">{sentLabel}</span>;
  }

  if (!open) {
    return (
      <button type="button" className="btn !text-xs text-dim" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <div className="surface-2 p-3 flex flex-col gap-2 text-xs absolute right-4 mt-10 z-10 w-64">
      <select className="input !text-xs" value={reason} onChange={(e) => setReason(e.target.value)}>
        {reasons.map(([value, rLabel]) => (
          <option key={value} value={value}>
            {rLabel}
          </option>
        ))}
      </select>
      <textarea className="input !text-xs" rows={2} placeholder={locale === "en" ? "Details (optional)" : "詳細（任意）"} value={detail} onChange={(e) => setDetail(e.target.value)} />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary !text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("reason", reason);
              fd.set("detail", detail);
              await reportMemoryAction(memoryId, fd);
              setSent(true);
            })
          }
        >
          {locale === "en" ? "Send" : "送信"}
        </button>
        <button type="button" className="btn !text-xs" onClick={() => setOpen(false)}>
          {locale === "en" ? "Cancel" : "やめる"}
        </button>
      </div>
    </div>
  );
}
