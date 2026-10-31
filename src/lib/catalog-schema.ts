import { z } from 'astro/zod';
import { pricingValues } from './pricing.ts';

/** Browser-safe stand-in for Node's net.isIP, so the schema can run in the page. */
function isIpHostname(hostname: string): boolean {
  if (hostname.includes(':')) return true;
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

const text = z
  .string()
  .trim()
  .min(1)
  // eslint-disable-next-line no-control-regex -- reject control characters in catalog text
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), 'Use plain text on one line');
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase kebab-case slug');
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Use a real date in YYYY-MM-DD format');

const DISALLOWED_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'aff',
  'aff_id',
  'affiliate',
  'affiliate_id',
  'gclid',
  'fbclid',
  'dclid',
  'msclkid',
  'twclid',
  'mc_eid',
  'igshid',
]);

function hasTrackingParams(url: URL): boolean {
  for (const param of url.searchParams.keys()) {
    const lower = param.toLowerCase();
    if (DISALLOWED_QUERY_PARAMS.has(lower) || lower.startsWith('utm_')) return true;
  }
  return false;
}

// DNS resolution and redirect safety remain the link checker's responsibility.
// Syntax validation alone is not a safety verdict.
export const publicUrlSchema = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  const hostname = url.hostname.replace(/\.$/, '');
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    !hasTrackingParams(url) &&
    !isIpHostname(hostname) &&
    !hostname.includes(':') &&
    hostname.includes('.') &&
    !/(^|\.)(localhost|local|internal|invalid|test|home|lan|onion)$/.test(hostname) &&
    // eslint-disable-next-line no-control-regex -- reject control characters in URLs
    !/[\s\u0000-\u001f\u007f]/.test(value)
  );
}, 'Use an HTTPS URL with a public domain name, without embedded credentials or tracking parameters');

export const toolSchema = z
  .object({
    name: text,
    url: publicUrlSchema,
    description: text.refine(
      (value) => value.length >= 10,
      'Description must contain at least 10 characters',
    ),
    category: slugSchema,
    subcategory: z.object({ id: slugSchema, name: text }).strict().nullable().default(null),
    order: z.number().int().nonnegative().default(9999),
    openSource: z.boolean().nullable().default(null),
    pricing: z.enum(pricingValues).nullable().default(null),
    status: z.enum(['listed', 'deprecated', 'discontinued']).default('listed'),
    source: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('readme-migration'), migratedAt: date }).strict(),
      z.object({ kind: z.literal('community'), addedAt: date }).strict(),
    ]),
  })
  .strict();

export const categorySchema = z
  .object({
    name: text,
    description: text,
    order: z.number().int().nonnegative(),
  })
  .strict();

export function listedTools<T extends { status: string }>(tools: T[]): T[] {
  return tools.filter((tool) => tool.status === 'listed');
}
