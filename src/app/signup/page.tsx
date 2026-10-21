import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { SignupForm } from "./SignupForm";

function safeNext(value: string | string[] | undefined): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  const locale = await getLocale();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="surface w-full max-w-sm p-6">
        <div className="mb-6">
          <p className="mono text-sm font-bold" style={{ color: "var(--text)" }}>
            FX PATTERN MEMORY
          </p>
          <p className="text-dim text-xs mt-1">
            {t(locale, "home.heroTitle1")} {t(locale, "home.heroTitle2")}
          </p>
        </div>
        <SignupForm locale={locale} next={next} />
        <p className="text-faint text-xs mt-4 text-center">
          {locale === "en" ? "Already have an account? " : "既にアカウントをお持ちの方は"}{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="hover:text-[var(--text)]" style={{ color: "var(--accent)" }}>
            {t(locale, "nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
