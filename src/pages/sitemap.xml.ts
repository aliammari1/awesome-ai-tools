import type { APIRoute } from 'astro';
import { getCatalog, newestCatalogDate, toolDate } from '../lib/catalog';
import { curatedCollections } from '../lib/collections';
import { htmlLang, indexTranslatedLocales, localizedPath, locales } from '../lib/locales';

export const prerender = true;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const { tools, categories } = await getCatalog();
  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');
  const siteLastMod = newestCatalogDate(tools);

  const categoryLastMod = new Map<string, string>();
  for (const cat of categories) {
    const catTools = tools.filter((t) => t.category === cat.id);
    categoryLastMod.set(cat.id, catTools.length ? newestCatalogDate(catTools) : siteLastMod);
  }

  const baseEntries: Array<{ enPath: string; lastmod: string }> = [
    { enPath: '/en/', lastmod: siteLastMod },
    { enPath: '/en/about/methodology/', lastmod: siteLastMod },
    { enPath: '/en/contribute/', lastmod: siteLastMod },
    { enPath: '/en/collections/', lastmod: siteLastMod },
    { enPath: '/en/insights/', lastmod: siteLastMod },
    { enPath: '/en/changelog/', lastmod: siteLastMod },
    { enPath: '/en/privacy/', lastmod: siteLastMod },
    { enPath: '/en/link-health/', lastmod: siteLastMod },
    ...curatedCollections.map((col) => ({
      enPath: `/en/collections/${col.slug}/`,
      lastmod: siteLastMod,
    })),
    ...categories.map((category) => ({
      enPath: `/en/categories/${category.id}/`,
      lastmod: categoryLastMod.get(category.id) ?? siteLastMod,
    })),
    ...tools.map((tool) => ({
      enPath: `/en/tools/${tool.id}/`,
      lastmod: toolDate(tool),
    })),
  ];

  const activeLocales = indexTranslatedLocales ? locales : (['en'] as const);
  const urlBlocks: string[] = [];

  for (const { enPath, lastmod } of baseEntries) {
    const alternates = [
      ...activeLocales.map(
        (loc) =>
          `    <xhtml:link rel="alternate" hreflang="${htmlLang[loc]}" href="${escapeXml(origin + localizedPath(enPath, loc))}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(origin + enPath)}" />`,
    ].join('\n');

    for (const loc of activeLocales) {
      const locUrl = escapeXml(origin + localizedPath(enPath, loc));
      urlBlocks.push(
        `  <url>\n    <loc>${locUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`,
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlBlocks.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
