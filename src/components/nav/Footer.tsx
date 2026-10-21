import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";

// §82 Legal導線。内容未確定のためDraft扱い（/legal/[slug]参照）。
export async function Footer() {
  const locale = await getLocale();
  const en = locale === "en";

  return (
    <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-faint">
      <Link href="/legal/terms" className="hover:text-[var(--text)]">
        {en ? "Terms" : "利用規約"}
      </Link>
      <Link href="/legal/privacy" className="hover:text-[var(--text)]">
        {en ? "Privacy" : "プライバシーポリシー"}
      </Link>
      <Link href="/legal/risk" className="hover:text-[var(--text)]">
        {en ? "Risk Disclaimer" : "リスク開示"}
      </Link>
      <span>© FX PATTERN MEMORY</span>
    </footer>
  );
}
