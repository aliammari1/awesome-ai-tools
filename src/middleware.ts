import { defineMiddleware } from 'astro:middleware';

const LOCALES = ['en', 'fr', 'ar', 'es', 'de', 'zh', 'ja'];
const DEFAULT_LOCALE = 'en';

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

export const onRequest = defineMiddleware((context, next) => {
  const pathname = context.url.pathname;
  const base = '/awesome-ai-tools';
  
  // Remove base from pathname to check if at root
  const pathAfterBase = pathname.startsWith(base) 
    ? pathname.slice(base.length) 
    : pathname;
  
  // If accessing root or /awesome-ai-tools/, redirect to locale
  if (pathAfterBase === '' || pathAfterBase === '/') {
    const acceptLanguage = context.request.headers.get('accept-language') || '';
    
    // Parse accept-language header to find first matching locale
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .map(lang => LANGUAGE_MAP[lang] || lang.split('-')[0])
      .filter(lang => LOCALES.includes(lang));
    
    const preferredLocale = languages[0] || DEFAULT_LOCALE;
    const redirectUrl = `${base}/${preferredLocale}/`;
    
    return context.redirect(redirectUrl, 302);
  }
  
  // Check if path starts with a valid locale
  const pathParts = pathAfterBase.split('/').filter(Boolean);
  const firstSegment = pathParts[0];
  
  // If not a valid locale in the path, redirect to default
  if (firstSegment && !LOCALES.includes(firstSegment)) {
    // This path doesn't have a locale prefix, so check browser preference
    const acceptLanguage = context.request.headers.get('accept-language') || '';
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .map(lang => LANGUAGE_MAP[lang] || lang.split('-')[0])
      .filter(lang => LOCALES.includes(lang));
    
    const preferredLocale = languages[0] || DEFAULT_LOCALE;
    const redirectUrl = `${base}/${preferredLocale}${pathAfterBase}`;
    
    return context.redirect(redirectUrl, 302);
  }
  
  return next();
});
