import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { toolSchema, categorySchema } from './lib/catalog-schema';

const tools = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: './catalog/tools',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: toolSchema,
});

const categories = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: './catalog/categories',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: categorySchema,
});

export const collections = { tools, categories };
