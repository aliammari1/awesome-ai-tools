export const locales = ['en', 'fr', 'ar', 'es', 'de', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const legacyLocaleLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function englishCanonicalPath(pathname: string, locale: Locale) {
  if (locale === 'en') return pathname;
  return pathname.replace(new RegExp('^/' + locale + '(?=/|$)'), '/en');
}
