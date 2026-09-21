import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tools = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './catalog/tools',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    description: z.string().min(10),
    category: z.string().min(1),
    subcategory: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    }).nullable(),
    order: z.number().int().nonnegative(),
    openSource: z.boolean().nullable(),
    pricing: z.enum(['free', 'freemium', 'paid', 'contact-sales']).nullable(),
    status: z.enum(['listed', 'deprecated', 'discontinued']),
    source: z.object({
      kind: z.literal('readme-migration'),
      migratedAt: z.string(),
    }),
  }),
});

const categories = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './catalog/categories',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { tools, categories };
