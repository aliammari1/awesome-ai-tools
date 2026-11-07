import type { APIRoute } from 'astro';
import { countByCategory, getCatalog, newestCatalogDate } from '../../lib/catalog';

export const prerender = true;

export const GET: APIRoute = async () => {
  const { tools, categories } = await getCatalog();
  const counts = countByCategory(tools);

  const payload = {
    version: 1,
    updatedAt: newestCatalogDate(tools),
    count: categories.length,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      order: category.order,
      toolCount: counts[category.id] ?? 0,
      openSourceCount: tools.filter(
        (tool) => tool.category === category.id && tool.openSource === true,
      ).length,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
