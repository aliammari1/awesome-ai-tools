import { defineCollection } from 'astro:content';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

export const collections = {
  docs: defineCollection({
    loader: glob({
      pattern: '**/*.{md,mdx}',
      base: './src/content/docs'
    }),
    schema: docsSchema()
  }),
  i18n: defineCollection({
    loader: glob({
      pattern: '**/*.json',
      base: './src/content/i18n'
    }),
    schema: i18nSchema()
  })
};
