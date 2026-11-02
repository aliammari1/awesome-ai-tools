import type { APIRoute } from 'astro';
import { pricingValues } from '../../lib/pricing';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${origin}/api/schema.json`,
    title: 'Awesome AI Tools Catalog Entry',
    description: 'Schema for individual JSON tool records in catalog/tools/<slug>.json.',
    type: 'object',
    additionalProperties: false,
    required: [
      'name',
      'url',
      'description',
      'category',
      'subcategory',
      'pricing',
      'openSource',
      'status',
      'source',
    ],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Official name of the AI tool.',
      },
      url: {
        type: 'string',
        format: 'uri',
        pattern: '^https://',
        description: 'Canonical HTTPS URL without affiliate or tracking query parameters.',
      },
      description: {
        type: 'string',
        minLength: 10,
        description: 'Plain, factual one-sentence summary of what the software does.',
      },
      category: {
        type: 'string',
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        description: 'Primary category slug from catalog/categories/.',
      },
      subcategory: {
        oneOf: [
          { type: 'null' },
          {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'name'],
            properties: {
              id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
              name: { type: 'string', minLength: 1 },
            },
          },
        ],
      },
      order: {
        type: 'integer',
        minimum: 0,
      },
      openSource: {
        type: ['boolean', 'null'],
        description:
          'true if source code is publicly available under an open license, false if proprietary, null if unverified.',
      },
      pricing: {
        oneOf: [{ type: 'null' }, { type: 'string', enum: [...pricingValues] }],
      },
      status: {
        type: 'string',
        enum: ['listed', 'deprecated', 'discontinued'],
        default: 'listed',
      },
      source: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['kind', 'migratedAt'],
            properties: {
              kind: { const: 'readme-migration' },
              migratedAt: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['kind', 'addedAt'],
            properties: {
              kind: { const: 'community' },
              addedAt: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            },
          },
        ],
      },
    },
  };

  return new Response(JSON.stringify(schema, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
  });
};
