import { requireAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { MemoryForm } from "@/components/memory/MemoryForm";

export default async function PostPage() {
  await requireAuth("/post");
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold">{t(locale, "nav.addCase")}</h1>
      </div>
      <MemoryForm locale={locale} />
    </div>
  );
}
