import type { APIRoute } from 'astro';
import { countByCategory, getCatalog, newestCatalogDate } from '../lib/catalog';
import { curatedCollections } from '../lib/collections';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const { tools, categories } = await getCatalog();
  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');
  const counts = countByCategory(tools);
  const openSourceCount = tools.filter((t) => t.openSource === true).length;
  const lastUpdated = newestCatalogDate(tools);

  const lines = [
    '# Awesome AI Tools',
    '',
    '> An open, plainly described catalog of AI tools. Maintained as JSON records under CC0 1.0 Public Domain, with zero rankings, zero paid placements and zero affiliate links.',
    '',
    `- Listed tools: ${tools.length}`,
    `- Primary domains: ${categories.length}`,
    `- Open-source tools: ${openSourceCount}`,
    `- Last catalog update: ${lastUpdated}`,
    '',
    '## Machine-readable endpoints',
    '',
    `- [Full tools JSON](${origin}/api/tools.json): All ${tools.length} listed catalog records.`,
    `- [Categories JSON](${origin}/api/categories.json): All ${categories.length} domain definitions and counts.`,
    `- [Tools CSV](${origin}/api/tools.csv): Spreadsheet export of listed tools.`,
    `- [Catalog JSON Schema](${origin}/api/schema.json): Validation schema for tool entries.`,
    `- [Global Atom Feed](${origin}/feed.xml): Recent catalog additions.`,
    `- [Sitemap](${origin}/sitemap.xml): Localized URLs across 7 languages.`,
    '',
    '## Primary pages',
    '',
    `- [Directory Home](${origin}/en/)`,
    `- [Curated Collections](${origin}/en/collections/)`,
    `- [Catalog Insights](${origin}/en/insights/)`,
    `- [Catalog Changelog](${origin}/en/changelog/)`,
    `- [Curation Methodology](${origin}/en/about/methodology/)`,
    `- [Contribute / Add a Tool](${origin}/en/contribute/)`,
    '',
    '## Domains',
    '',
    ...categories.map(
      (cat) =>
        `- [${cat.name}](${origin}/en/categories/${cat.id}/) (${counts[cat.id] ?? 0} tools): ${cat.description} · [Feed](${origin}/feeds/${cat.id}.xml)`,
    ),
    '',
    '## Curated collections',
    '',
    ...curatedCollections.map(
      (col) => `- [${col.title}](${origin}/en/collections/${col.slug}/): ${col.lead}`,
    ),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
