import { defineMiddleware } from 'astro:middleware';

const LOCALES = ['en', 'fr', 'ar', 'es', 'de', 'zh', 'ja'];
const DEFAULT_LOCALE = 'en';
const LEGACY_BASE = '/awesome-ai-tools';

// Map browser language codes to supported locales
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'ar': 'ar',
  'ar-SA': 'ar',
  'ar-EG': 'ar',
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-Hans': 'zh',
  'ja': 'ja',
  'ja-JP': 'ja'
};

function getPreferredLocale(acceptLanguage: string) {
  const languages = acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0].trim())
    .map((lang) => LANGUAGE_MAP[lang] || lang.split('-')[0])
    .filter((lang) => LOCALES.includes(lang));

  return languages[0] || DEFAULT_LOCALE;
}

export const onRequest = defineMiddleware((context, next) => {
  const originalPathname = context.url.pathname;
  const pathname =
    originalPathname === LEGACY_BASE || originalPathname.startsWith(`${LEGACY_BASE}/`)
      ? originalPathname.slice(LEGACY_BASE.length) || '/'
      : originalPathname;

  if (pathname === '/' || pathname === '') {
    const preferredLocale = getPreferredLocale(
      context.request.headers.get('accept-language') || '',
    );

    return context.redirect(`/${preferredLocale}/`, 302);
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const firstSegment = pathParts[0];

  if (firstSegment && !LOCALES.includes(firstSegment)) {
    const preferredLocale = getPreferredLocale(
      context.request.headers.get('accept-language') || '',
    );

    return context.redirect(`/${preferredLocale}${pathname}`, 302);
  }

  if (originalPathname !== pathname) {
    return context.redirect(pathname, 302);
  }

  return next();
});
