import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/nav/LanguageSwitcher";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";

// §97 Mobile Header: Logo / Language程度。Desktopの主Navigationは<Sidebar>へ委譲。
export async function TopNav() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  return (
    <>
      <header
        className="sm:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 shrink-0"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2 shrink-0 flex-1 min-w-0">
          <span className="mono text-sm font-bold tracking-wide whitespace-nowrap" style={{ color: "var(--text)" }}>
            FX PATTERN MEMORY
          </span>
        </Link>
        <LanguageSwitcher locale={locale} />
      </header>
      <MobileBottomNav
        isAuthed={Boolean(user)}
        labels={{
          home: t(locale, "nav.home"),
          patterns: t(locale, "nav.patterns"),
          saved: t(locale, "nav.saved"),
          journal: t(locale, "nav.myCases"),
          login: t(locale, "nav.login"),
        }}
      />
    </>
  );
}
