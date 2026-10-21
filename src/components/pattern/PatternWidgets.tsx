"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSavePatternAction } from "@/lib/actions/pattern";

export function SavePatternButton({
  patternId,
  initialSaved,
  viewerExists,
  labelSave,
  labelSaved,
}: {
  patternId: string;
  initialSaved: boolean;
  viewerExists: boolean;
  labelSave: string;
  labelSaved: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!viewerExists) {
    return (
      <button type="button" className="btn !text-xs" onClick={() => router.push("/login")}>
        {labelSave}
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
          await toggleSavePatternAction(patternId);
        })
      }
    >
      {saved ? labelSaved : labelSave}
    </button>
  );
}
