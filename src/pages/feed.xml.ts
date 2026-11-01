import type { APIRoute } from 'astro';
import { getCatalog, newestCatalogDate, recentTools, toolDate } from '../lib/catalog';

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
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const latest = recentTools(tools, 50);
  const updated = newestCatalogDate(tools) + 'T00:00:00Z';

  const entries = latest
    .map((tool) => {
      const dateIso = toolDate(tool) + 'T00:00:00Z';
      const detailUrl = `${origin}/en/tools/${tool.id}/`;
      const catLabel = categoryNames[tool.category] ?? tool.category;
      return [
        '  <entry>',
        `    <title>${escapeXml(tool.name)}</title>`,
        `    <id>${escapeXml(detailUrl)}</id>`,
        `    <link href="${escapeXml(detailUrl)}" rel="alternate" />`,
        `    <link href="${escapeXml(tool.url)}" rel="related" />`,
        `    <updated>${dateIso}</updated>`,
        `    <category term="${escapeXml(tool.category)}" label="${escapeXml(catLabel)}" />`,
        `    <summary>${escapeXml(tool.description)}</summary>`,
        '  </entry>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <title>Awesome AI Tools — Recent Additions</title>',
    '  <subtitle>Plainly described AI tools added to the open catalog.</subtitle>',
    `  <id>${escapeXml(origin + '/feed.xml')}</id>`,
    `  <link href="${escapeXml(origin + '/feed.xml')}" rel="self" type="application/atom+xml" />`,
    `  <link href="${escapeXml(origin + '/en/')}" rel="alternate" type="text/html" />`,
    `  <updated>${updated}</updated>`,
    '  <rights>CC0 1.0 Universal (Public Domain)</rights>',
    entries,
    '</feed>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
