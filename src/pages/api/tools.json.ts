import type { APIRoute } from 'astro';
import { getCatalog, newestCatalogDate, toolDate } from '../../lib/catalog';

export const prerender = true;

export const GET: APIRoute = async () => {
  const { tools, categories } = await getCatalog();
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const payload = {
    version: 1,
    updatedAt: newestCatalogDate(tools),
    count: tools.length,
    tools: tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      url: tool.url,
      description: tool.description,
      category: tool.category,
      categoryName: categoryNames[tool.category] ?? tool.category,
      subcategory: tool.subcategory,
      pricing: tool.pricing,
      openSource: tool.openSource,
      status: tool.status,
      source: tool.source,
      addedDate: toolDate(tool),
    })),
  };

  return new Response(JSON.stringify(payload, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
