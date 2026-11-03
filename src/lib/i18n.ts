import { en, type MessageKey } from '../i18n/en.ts';
import { fr } from '../i18n/fr.ts';
import { es } from '../i18n/es.ts';
import { de } from '../i18n/de.ts';
import { ar } from '../i18n/ar.ts';
import { zh } from '../i18n/zh.ts';
import { ja } from '../i18n/ja.ts';
import { locales, type Locale } from './locales.ts';

export type { MessageKey };

export const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  en,
  fr,
  es,
  de,
  ar,
  zh,
  ja,
};

export type Params = Record<string, string | number>;

export function format(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  return format(dictionaries[locale][key] ?? en[key], params);
}

/** Returns a translator bound to one locale. */
export function useTranslations(locale: Locale) {
  return (key: MessageKey, params?: Params) => translate(locale, key, params);
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(locale: Locale, value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value + 'T00:00:00Z') : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export { locales };
