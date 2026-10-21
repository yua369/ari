"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type ChartImage = { id: string; timeframe: string };

// §18/§64 Chart Viewer: Entry/After比較、クリックでFullscreen、Escで閉じる。Chartを主役にする。
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
  const [lightbox, setLightbox] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      {(entryImages.length > 0 || afterImages.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-4">
          <ImageGroup title={entryTitle} noImageLabel={noImageLabel} images={entryImages} onOpen={setLightbox} />
          <ImageGroup title={afterTitle} noImageLabel={noImageLabel} images={afterImages} onOpen={setLightbox} />
        </section>
      )}

      {otherImages.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">{otherTitle}</h2>
          <ImageGroup title="" noImageLabel={noImageLabel} images={otherImages} onOpen={setLightbox} />
        </section>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
          style={{ background: "rgba(5,8,13,0.92)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 btn !px-3 !py-2 text-sm"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <img
            src={`/api/images/${lightbox.id}/original`}
            alt={lightbox.title}
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
  onOpen,
}: {
  title: string;
  noImageLabel: string;
  images: ChartImage[];
  onOpen: (v: { id: string; title: string }) => void;
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
            onClick={() => onOpen({ id: img.id, title: title || img.timeframe })}
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
