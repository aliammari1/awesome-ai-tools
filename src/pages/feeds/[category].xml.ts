import type { APIRoute, GetStaticPaths } from 'astro';
import { getCatalog, newestCatalogDate, recentTools, toolDate } from '../../lib/catalog';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const { categories } = await getCatalog();
  return categories.map((category) => ({
    params: { category: category.id },
  }));
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ params, site }) => {
  const { tools, categories } = await getCatalog();
  const category = categories.find((entry) => entry.id === params.category);
  if (!category) return new Response('Not found', { status: 404 });

  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');
  const domainTools = recentTools(
    tools.filter((tool) => tool.category === category.id),
    50,
  );
  const updatedDate = domainTools.length
    ? newestCatalogDate(domainTools)
    : newestCatalogDate(tools);
  const pubDate = new Date(updatedDate + 'T00:00:00Z').toUTCString();
  const feedUrl = `${origin}/feeds/${category.id}.xml`;
  const channelLink = `${origin}/en/categories/${category.id}/`;

  const items = domainTools
    .map((tool) => {
      const detailUrl = `${origin}/en/tools/${tool.id}/`;
      const itemDate = new Date(toolDate(tool) + 'T00:00:00Z').toUTCString();
      return [
        '    <item>',
        `      <title>${escapeXml(tool.name)}</title>`,
        `      <link>${escapeXml(detailUrl)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(detailUrl)}</guid>`,
        `      <pubDate>${itemDate}</pubDate>`,
        `      <category>${escapeXml(category.name)}</category>`,
        `      <description>${escapeXml(tool.description + ' Official site: ' + tool.url)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml('Awesome AI Tools · ' + category.name)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(category.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${pubDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
