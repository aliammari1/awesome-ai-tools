export const locales = ['en', 'fr', 'ar', 'es', 'de', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Whether translated locales may be indexed by search engines.
 *
 * The interface is translated but catalog descriptions are still English, so the
 * pages are linked with hreflang. Set this to false to mark every non-English page
 * `noindex` until descriptions are translated too.
 */
export const indexTranslatedLocales = true;

export const legacyLocaleLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
};

/** BCP 47 tag for `<html lang>` and `hreflang`. */
export const htmlLang: Record<Locale, string> = {
  en: 'en',
  fr: 'fr',
  ar: 'ar',
  es: 'es',
  de: 'de',
  zh: 'zh-Hans',
  ja: 'ja',
};

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  ar: 'ar_AR',
  es: 'es_ES',
  de: 'de_DE',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

export const textDirection: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  fr: 'ltr',
  ar: 'rtl',
  es: 'ltr',
  de: 'ltr',
  zh: 'ltr',
  ja: 'ltr',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Replace the leading locale segment: `/fr/tools/x/` -> `/es/tools/x/`. */
export function localizedPath(pathname: string, locale: Locale): string {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$)/);
  if (match && isLocale(match[1])) return '/' + locale + pathname.slice(match[0].length);
  return '/' + locale + (pathname.startsWith('/') ? pathname : '/' + pathname);
}

export function englishCanonicalPath(pathname: string, locale: Locale) {
  if (locale === 'en') return pathname;
  return localizedPath(pathname, 'en');
}

/** Pick the best supported locale from `navigator.languages`-style tags. */
export function matchLocale(preferred: readonly string[]): Locale | null {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return null;
}
