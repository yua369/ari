"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "@/lib/i18n";

export async function setLocaleAction(locale: Locale) {
  const normalized = normalizeLocale(locale);
  const store = await cookies();
  store.set(LOCALE_COOKIE, normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // ログイン中ならUser.localeにも保存し、将来デバイスをまたいでも同じ言語になるようにする。
  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { locale: normalized } });
  }
}
