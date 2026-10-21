import { ja, en, type TranslationKey } from "./dictionaries";

export type Locale = "ja" | "en";
export const LOCALE_COOKIE = "fxpm_locale";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { ja, en };

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "ja";
}

export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries.ja[key] ?? key;
}

export function translator(locale: Locale) {
  return (key: TranslationKey) => t(locale, key);
}

export { type TranslationKey };
