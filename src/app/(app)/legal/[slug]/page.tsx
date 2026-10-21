import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";

// §82 Legal導線: 内容未確定のためDraft扱いのPlaceholder。法的に最終確定したと断定しない。
const PAGES: Record<string, { ja: { title: string; body: string }; en: { title: string; body: string } }> = {
  terms: {
    ja: {
      title: "利用規約（Draft）",
      body: "この利用規約は現在準備中のDraftです。正式な内容はサービス正式公開までに確定・掲載します。",
    },
    en: {
      title: "Terms of Service (Draft)",
      body: "These Terms of Service are currently a draft in preparation. The final content will be confirmed and published before official launch.",
    },
  },
  privacy: {
    ja: {
      title: "プライバシーポリシー（Draft）",
      body: "このプライバシーポリシーは現在準備中のDraftです。正式な内容はサービス正式公開までに確定・掲載します。",
    },
    en: {
      title: "Privacy Policy (Draft)",
      body: "This Privacy Policy is currently a draft in preparation. The final content will be confirmed and published before official launch.",
    },
  },
  risk: {
    ja: {
      title: "リスク開示（Draft）",
      body: "本サービスは、トレード経験の記録・Pattern分類・学習支援を目的としたものであり、投資助言・売買シグナル・利益を保証するものではありません。本文は現在準備中のDraftです。",
    },
    en: {
      title: "Risk Disclaimer (Draft)",
      body: "This service is intended for recording trading experience, classifying patterns, and supporting learning. It does not provide investment advice, trading signals, or any guarantee of profit. This text is currently a draft.",
    },
  },
};

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const entry = PAGES[slug];
  if (!entry) notFound();
  const locale = await getLocale();
  const { title, body } = entry[locale];

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-dim text-sm whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  );
}
