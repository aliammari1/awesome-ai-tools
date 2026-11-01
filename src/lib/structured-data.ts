import type { Tool } from './catalog';
import { htmlLang, type Locale } from './locales';

export function buildWebSiteJsonLd(
  origin: string,
  locale: Locale,
  siteName: string,
  description: string,
) {
  const baseUrl = origin.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: `${baseUrl}/${locale}/`,
    inLanguage: htmlLang[locale],
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/?q={search_term_string}#directory`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildItemListJsonLd(
  origin: string,
  locale: Locale,
  name: string,
  items: Array<Pick<Tool, 'id' | 'name' | 'description'>>,
) {
  const baseUrl = origin.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 24).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      description: tool.description,
      url: `${baseUrl}/${locale}/tools/${tool.id}/`,
    })),
  };
}

export function buildBreadcrumbJsonLd(
  origin: string,
  crumbs: Array<{ label: string; href: string }>,
  currentTitle: string,
  currentPathname: string,
) {
  const baseUrl = origin.replace(/\/$/, '');
  const all = [...crumbs, { label: currentTitle, href: currentPathname }];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${baseUrl}${crumb.href.startsWith('/') ? crumb.href : '/' + crumb.href}`,
    })),
  };
}

export function buildSoftwareApplicationJsonLd(
  origin: string,
  locale: Locale,
  tool: Tool,
  categoryName: string,
) {
  const baseUrl = origin.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: categoryName,
    applicationSubCategory: tool.subcategory?.name ?? undefined,
    url: `${baseUrl}/${locale}/tools/${tool.id}/`,
    sameAs: tool.url,
    isAccessibleForFree: tool.pricing === 'free' || tool.openSource === true ? true : undefined,
  };
}
