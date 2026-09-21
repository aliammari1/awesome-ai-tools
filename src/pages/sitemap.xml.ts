import type { APIRoute } from 'astro';
import { getCatalog } from '../lib/catalog';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const { tools, categories } = await getCatalog();
  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');
  const paths = [
    '/en/',
    '/en/about/methodology/',
    '/en/contribute/',
    ...categories.map((category) => `/en/categories/${category.id}/`),
    ...tools.map((tool) => `/en/tools/${tool.id}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
