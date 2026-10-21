import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./index";

// §SEO/URL: 今は/ja /enのURL分離はしないが、Locale型を1箇所に集約しておくことで将来の拡張がしやすい。
// 優先順位: Cookie（今のブラウザでの選択） > ログインUserのlocale（他端末からの引き継ぎ） > "ja"
// 注意: このファイルはServer Component/Server Action専用。クライアントから@/lib/i18nを使う場合は
// server.tsを経由せず、index.ts（t/normalizeLocale/Locale型のみ）を直接importすること。
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (cookieValue) return normalizeLocale(cookieValue);

  const user = await getCurrentUser();
  if (user?.locale) return normalizeLocale(user.locale);

  return "ja";
}
