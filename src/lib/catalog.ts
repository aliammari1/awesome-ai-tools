import { getCollection } from 'astro:content';

export async function getCatalog() {
  const [toolEntries, categoryEntries] = await Promise.all([
    getCollection('tools'),
    getCollection('categories'),
  ]);

  const tools = toolEntries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort((a, b) => a.order - b.order);

  const categories = categoryEntries
    .map((entry) => ({ id: entry.id, ...entry.data }))
    .sort((a, b) => a.order - b.order);

  return { tools, categories };
}

export function countByCategory(tools: Array<{ category: string }>) {
  return tools.reduce<Record<string, number>>((counts, tool) => {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
    return counts;
  }, {});
}
