import { getCollection } from 'astro:content';
import type { z } from 'astro/zod';
import { categorySchema, listedTools, toolSchema } from './catalog-schema';

export type Tool = z.infer<typeof toolSchema> & { id: string };
export type Category = z.infer<typeof categorySchema> & { id: string };

export async function getCatalog(): Promise<{ tools: Tool[]; categories: Category[] }> {
  const [toolEntries, categoryEntries] = await Promise.all([
    getCollection('tools'),
    getCollection('categories'),
  ]);

  const tools = listedTools(
    toolEntries.map((entry) => ({ id: entry.id, ...entry.data }) as Tool),
  ).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, 'en'));

  const categories = categoryEntries
    .map((entry) => ({ id: entry.id, ...entry.data }) as Category)
    .sort((a, b) => a.order - b.order);

  return { tools, categories };
}

export function countByCategory(tools: Array<Pick<Tool, 'category'>>) {
  return tools.reduce<Record<string, number>>((counts, tool) => {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
    return counts;
  }, {});
}
