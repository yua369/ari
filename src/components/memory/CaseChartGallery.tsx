"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type ChartImage = { id: string; timeframe: string };
type FlatImage = { id: string; timeframe: string; group: string };

// §18/§64 Chart Viewer: Entry/After比較、クリックでFullscreen、矢印/スワイプで切替、Escで閉じる。
export function CaseChartGallery({
  entryImages,
  afterImages,
  otherImages,
  entryTitle,
  afterTitle,
  otherTitle,
  noImageLabel,
}: {
  entryImages: ChartImage[];
  afterImages: ChartImage[];
  otherImages: ChartImage[];
  entryTitle: string;
  afterTitle: string;
  otherTitle: string;
  noImageLabel: string;
}) {
  const allImages: FlatImage[] = [
    ...entryImages.map((i) => ({ ...i, group: entryTitle })),
    ...afterImages.map((i) => ({ ...i, group: afterTitle })),
    ...otherImages.map((i) => ({ ...i, group: otherTitle })),
  ];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < allImages.length - 1;
  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex((i) => (i !== null && i < allImages.length - 1 ? i + 1 : i));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, allImages.length]);

  const current = lightboxIndex !== null ? allImages[lightboxIndex] : null;

  return (
    <>
      {(entryImages.length > 0 || afterImages.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-4">
          <ImageGroup title={entryTitle} noImageLabel={noImageLabel} images={entryImages} allImages={allImages} onOpen={setLightboxIndex} />
          <ImageGroup title={afterTitle} noImageLabel={noImageLabel} images={afterImages} allImages={allImages} onOpen={setLightboxIndex} />
        </section>
      )}

      {otherImages.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{otherTitle}</h2>
          <ImageGroup title="" noImageLabel={noImageLabel} images={otherImages} allImages={allImages} onOpen={setLightboxIndex} />
        </section>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.group}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
          style={{ background: "rgba(5,8,13,0.92)" }}
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (delta > 50) goPrev();
            else if (delta < -50) goNext();
          }}
        >
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-xs text-faint mono">
            {current.group} · {lightboxIndex! + 1} / {allImages.length}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 btn !px-3 !py-2 text-sm"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
          {hasPrev && (
            <button
              type="button"
              aria-label="Previous"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 btn !px-3 !py-3 text-lg"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              ‹
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              aria-label="Next"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 btn !px-3 !py-3 text-lg"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              ›
            </button>
          )}
          <img
            src={`/api/images/${current.id}/original`}
            alt={current.group}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function ImageGroup({
  title,
  noImageLabel,
  images,
  allImages,
  onOpen,
}: {
  title: string;
  noImageLabel: string;
  images: ChartImage[];
  allImages: FlatImage[];
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) {
    return title ? (
      <div className="flex flex-col gap-2">
        <p className="field-label">{title}</p>
        <div className="surface-2 aspect-video flex items-center justify-center text-faint text-xs">{noImageLabel}</div>
      </div>
    ) : null;
  }
  return (
    <div className="flex flex-col gap-2">
      {title && <p className="field-label">{title}</p>}
      <div className="grid gap-2" style={{ gridTemplateColumns: images.length > 1 ? "repeat(auto-fill, minmax(140px, 1fr))" : "1fr" }}>
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onOpen(allImages.findIndex((a) => a.id === img.id))}
            className="relative block aspect-video rounded overflow-hidden border cursor-zoom-in"
            style={{ borderColor: "var(--border)" }}
          >
            <Image src={`/api/images/${img.id}/thumb`} alt={title || img.timeframe} fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>
    </div>
  );
}
