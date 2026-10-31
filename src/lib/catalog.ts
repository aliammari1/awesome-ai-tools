import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import type { z } from 'astro/zod';
import { categorySchema, listedTools, toolSchema } from './catalog-schema';

export type Tool = z.infer<typeof toolSchema> & { id: string };
export type Category = z.infer<typeof categorySchema> & { id: string };

export interface GithubFact {
  repo: string;
  stars: number;
  lastCommit: string | null;
  license: string | null;
  asOf: string;
}

export function toolDate(tool: Pick<Tool, 'source'>): string {
  return tool.source.kind === 'community' ? tool.source.addedAt : tool.source.migratedAt;
}

export function newestCatalogDate(tools: Array<Pick<Tool, 'source'>>): string {
  let newest = '2026-09-21';
  for (const tool of tools) {
    const d = toolDate(tool);
    if (d > newest) newest = d;
  }
  return newest;
}

export function recentTools(tools: Tool[], limit = 12): Tool[] {
  return [...tools]
    .sort(
      (a, b) =>
        toolDate(b).localeCompare(toolDate(a)) ||
        a.order - b.order ||
        a.id.localeCompare(b.id, 'en'),
    )
    .slice(0, limit);
}

export function similarTools(tools: Tool[], current: Tool, limit = 6): Tool[] {
  const words = new Set(
    current.description
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  return tools
    .filter((entry) => entry.category === current.category && entry.id !== current.id)
    .map((entry) => {
      const sameSub =
        current.subcategory && entry.subcategory?.id === current.subcategory.id ? 100 : 0;
      const overlap = entry.description
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => words.has(w)).length;
      return { entry, score: sameSub + overlap };
    })
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

let cachedGithubFacts: Record<string, GithubFact> | null = null;

export async function getGithubFacts(): Promise<Record<string, GithubFact>> {
  if (cachedGithubFacts) return cachedGithubFacts;
  try {
    const raw = await readFile(join(process.cwd(), 'catalog/github-facts.json'), 'utf8');
    const parsed = JSON.parse(raw);
    cachedGithubFacts = typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    cachedGithubFacts = {};
  }
  return cachedGithubFacts ?? {};
}

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

export function changelogGroups(tools: Tool[]): Array<{ date: string; tools: Tool[] }> {
  const groups = new Map<string, Tool[]>();
  for (const tool of tools) {
    const date = toolDate(tool);
    const bucket = groups.get(date) ?? [];
    bucket.push(tool);
    groups.set(date, bucket);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, entries]) => ({
      date,
      tools: entries.sort((a, b) => a.name.localeCompare(b.name, 'en')),
    }));
}

export function additionsByMonth(tools: Tool[]): Array<{ month: string; count: number }> {
  const counts = new Map<string, number>();
  for (const tool of tools) {
    const month = toolDate(tool).slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

export function countByCategory(tools: Array<Pick<Tool, 'category'>>) {
  return tools.reduce<Record<string, number>>((counts, tool) => {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
    return counts;
  }, {});
}
