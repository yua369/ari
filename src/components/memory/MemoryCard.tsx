import Link from "next/link";
import Image from "next/image";
import { DirectionBadge, OutcomeBadge, ProcessQualityBadge } from "@/components/ui/Badge";
import type { Locale } from "@/lib/i18n";

type Props = {
  id: string;
  title: string;
  patternName: string;
  summary: string;
  symbol: string;
  occurredAt: Date;
  direction: string;
  outcome: string;
  processQuality?: string;
  visibility?: string;
  contributor?: string;
  thumbnailUrl: string | null;
  locale?: Locale;
};

export function MemoryCard(props: Props) {
  return (
    <Link
      href={`/memories/${props.id}`}
      className="surface flex flex-col overflow-hidden hover:border-[var(--accent)] transition-colors group"
    >
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {props.thumbnailUrl ? (
          <Image
            src={props.thumbnailUrl}
            alt={props.title}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-faint text-xs">NO IMAGE</div>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-faint mono">
          <span>{props.symbol}</span>
          <span>·</span>
          <time dateTime={props.occurredAt.toISOString()}>{props.occurredAt.toISOString().slice(0, 10)}</time>
          {props.contributor && (
            <>
              <span>·</span>
              <span className="truncate">@{props.contributor}</span>
            </>
          )}
        </div>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{props.patternName}</h3>
        <p className="text-xs text-dim line-clamp-2">{props.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <DirectionBadge value={props.direction} locale={props.locale} />
          <OutcomeBadge value={props.outcome} locale={props.locale} />
          {props.processQuality && props.processQuality !== "UNRATED" && (
            <ProcessQualityBadge value={props.processQuality} />
          )}
        </div>
      </div>
    </Link>
  );
}
