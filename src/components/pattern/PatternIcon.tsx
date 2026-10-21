import type { IconDefinition, MarkerType } from "@/lib/pattern-icon";

// §8 Visual Grammar / §86 配色 / §87 Accessibility（色だけで区別しない）。
// Patternは方向(Long/Short)ではなく構造を覚えるためのものなので、
// 基調色は White/Gray、水平線はAccent、重要Pointは形状で区別する。

function MarkerShape({ x, y, type }: { x: number; y: number; type: MarkerType }) {
  const accent2 = "var(--tag-amber)";
  switch (type) {
    case "failed_breakout":
      // バツ印: 失敗・否定
      return (
        <g stroke={accent2} strokeWidth={3} strokeLinecap="round">
          <line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} />
          <line x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} />
        </g>
      );
    case "structure_shift":
      // 小さな三角: 転換点
      return <polygon points={`${x},${y - 4} ${x - 4},${y + 3} ${x + 4},${y + 3}`} fill={accent2} />;
    case "retest":
      // 中空の円: 再接触
      return <circle cx={x} cy={y} r={3} fill="none" stroke={accent2} strokeWidth={2} />;
    case "double_test":
      // 二重円: 同エリアへの再接触
      return (
        <g fill="none" stroke={accent2} strokeWidth={1.8}>
          <circle cx={x} cy={y} r={2} />
          <circle cx={x} cy={y} r={4.5} />
        </g>
      );
    case "rebreak":
      // 上向き矢印: 再突破
      return <polygon points={`${x},${y - 5} ${x - 3.5},${y + 2} ${x + 3.5},${y + 2}`} fill="var(--accent)" />;
    case "expansion":
      // 外向き矢印2本: 加速
      return (
        <g stroke="var(--accent)" strokeWidth={2} strokeLinecap="round">
          <line x1={x} y1={y + 4} x2={x - 4} y2={y - 4} />
          <line x1={x} y1={y + 4} x2={x + 4} y2={y - 4} />
        </g>
      );
    case "rejection":
      // 塗り三角（下向き）: 反落
      return <polygon points={`${x},${y + 4} ${x - 4},${y - 3} ${x + 4},${y - 3}`} fill={accent2} />;
    case "breakout":
    default:
      return <circle cx={x} cy={y} r={2.5} fill="var(--accent)" />;
  }
}

export function PatternIcon({
  icon,
  className,
  title,
}: {
  icon: IconDefinition;
  className?: string;
  title?: string;
}) {
  const [x0, y0, w, h] = icon.viewBox;
  const points = icon.pricePath.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`${x0} ${y0} ${w} ${h}`}
      className={className}
      role="img"
      aria-label={title ?? "pattern icon"}
    >
      {icon.levels.map((lv, i) => (
        <line
          key={i}
          x1={x0}
          y1={lv.y}
          x2={x0 + w}
          y2={lv.y}
          stroke="var(--accent)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.75}
        />
      ))}
      <polyline
        points={points}
        fill="none"
        stroke="var(--text-dim)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {icon.markers.map((m, i) => (
        <MarkerShape key={i} x={m.x} y={m.y} type={m.type} />
      ))}
    </svg>
  );
}
