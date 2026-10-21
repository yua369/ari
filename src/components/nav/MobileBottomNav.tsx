"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// §95-96 Mobile Navigation: HOME / PATTERNS / ＋(Record Case) / SAVED / MY JOURNAL。中央＋がRecord Case。
export function MobileBottomNav({
  isAuthed,
  labels,
}: {
  isAuthed: boolean;
  labels: { home: string; patterns: string; saved: string; journal: string; login: string };
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const items = [
    { href: "/", label: labels.home, icon: "⌂" },
    { href: "/patterns", label: labels.patterns, icon: "◧" },
  ];
  const trailing = isAuthed
    ? [
        { href: "/saved", label: labels.saved, icon: "☆" },
        { href: "/mypage", label: labels.journal, icon: "▤" },
      ]
    : [{ href: "/login", label: labels.login, icon: "→" }];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[0.65rem]"
          style={{ color: isActive(it.href) ? "var(--accent)" : "var(--text-faint)", minHeight: 44 }}
        >
          <span aria-hidden className="text-base leading-none">{it.icon}</span>
          {it.label}
        </Link>
      ))}
      <Link
        href="/post"
        aria-label={labels.patterns}
        className="flex-1 flex flex-col items-center justify-center"
        style={{ minHeight: 44 }}
      >
        <span
          className="flex items-center justify-center rounded-full text-lg font-bold"
          style={{ width: 40, height: 40, background: "var(--accent)", color: "#05080d", marginTop: -14 }}
        >
          +
        </span>
      </Link>
      {trailing.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[0.65rem]"
          style={{ color: isActive(it.href) ? "var(--accent)" : "var(--text-faint)", minHeight: 44 }}
        >
          <span aria-hidden className="text-base leading-none">{it.icon}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
