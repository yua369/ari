import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/nav/LanguageSwitcher";
import { SidebarNav } from "@/components/nav/SidebarNav";

// §9-10/§21-24 Desktop App Shell: LEFT SIDEBAR。Mobileでは非表示(TopNav+MobileBottomNavに委譲)。
// 個人利用専用のためLogin/Signup/Logoutは廃止。常に唯一のオーナーアカウントとして動作する。
export async function Sidebar() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  const items = [
    { href: "/", label: t(locale, "nav.home"), icon: "⌂" },
    { href: "/quick", label: t(locale, "nav.quick"), icon: "⚡" },
    { href: "/patterns", label: t(locale, "nav.patterns"), icon: "◧" },
    { href: "/community", label: t(locale, "nav.community"), icon: "◎" },
    { href: "/mypage", label: t(locale, "nav.myCases"), icon: "▤" },
    { href: "/saved", label: t(locale, "nav.saved"), icon: "☆" },
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

      <Link href="/mypage" className="text-xs font-medium truncate px-1 hover:text-[var(--accent)]" style={{ color: "var(--text-dim)" }}>
        @{user.username}
      </Link>

      <div className="px-1">
        <LanguageSwitcher locale={locale} />
      </div>
    </aside>
  );
}
