"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };

// §9-10 Sidebar: Active=薄いBlue Background+左Indicator+明るいText / Inactive=Muted
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors relative"
            style={{
              color: active ? "var(--text)" : "var(--text-dim)",
              background: active ? "var(--accent-soft)" : "transparent",
              fontWeight: active ? 600 : 400,
            }}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
            <span aria-hidden className="text-base leading-none w-5 text-center" style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
