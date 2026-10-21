import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/nav/LanguageSwitcher";
import { SidebarNav } from "@/components/nav/SidebarNav";

// §9-10/§21-24 Desktop App Shell: LEFT SIDEBAR。Mobileでは非表示(TopNav+MobileBottomNavに委譲)。
export async function Sidebar() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const items = [
    { href: "/", label: t(locale, "nav.home"), icon: "⌂" },
    ...(user ? [{ href: "/quick", label: t(locale, "nav.quick"), icon: "⚡" }] : []),
    { href: "/patterns", label: t(locale, "nav.patterns"), icon: "◧" },
    { href: "/community", label: t(locale, "nav.community"), icon: "◎" },
    ...(user
      ? [
          { href: "/mypage", label: t(locale, "nav.myCases"), icon: "▤" },
          { href: "/saved", label: t(locale, "nav.saved"), icon: "☆" },
        ]
      : []),
  ];

  return (
    <aside
      className="hidden sm:flex flex-col shrink-0 w-[232px] h-screen sticky top-0 px-3 py-4 gap-4"
      style={{ borderRight: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <Link href="/" className="flex items-center gap-2 px-2 py-1 shrink-0">
        <span className="mono text-sm font-bold tracking-wide whitespace-nowrap" style={{ color: "var(--text)" }}>
          FX PATTERN MEMORY
        </span>
      </Link>

      <SidebarNav items={items} />

      <Link href="/post" className="btn btn-primary w-full !text-sm justify-center">
        {t(locale, "nav.addCase")}
      </Link>

      <div className="flex-1" />

      {!user ? (
        <div className="flex flex-col gap-1.5 px-1">
          <Link href="/signup" className="btn btn-primary w-full !text-xs justify-center">
            {t(locale, "nav.signup")}
          </Link>
          <Link href="/login" className="btn w-full !text-xs justify-center">
            {t(locale, "nav.login")}
          </Link>
        </div>
      ) : (
        <>
          {/* §55-56 PRO Card: Sidebar下部にCompact表示。Amber Accent、Casino感を出さない */}
          <Link
            href="/mypage"
            className="surface-2 flex flex-col gap-1 p-3 transition-colors"
            style={{ borderColor: "rgba(215,154,90,0.35)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>
                PRO
              </span>
              <span className="badge !text-[0.6rem]">FREE</span>
            </div>
            <p className="text-faint text-[0.65rem] leading-snug">
              {locale === "en" ? "$15/mo Global · ¥1,000/mo Japan" : "Global $15/月・Japan ¥1,000/月"}
            </p>
          </Link>

          <div className="flex items-center justify-between px-1 gap-2">
            <Link href="/mypage" className="text-xs font-medium truncate hover:text-[var(--accent)]" style={{ color: "var(--text-dim)" }}>
              @{user.username}
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-faint hover:text-[var(--text)] text-xs">
                {t(locale, "nav.logout")}
              </button>
            </form>
          </div>
        </>
      )}

      <div className="px-1">
        <LanguageSwitcher locale={locale} />
      </div>
    </aside>
  );
}
