/**
 * Display labels for the catalog's pricing enum.
 *
 * Kept in a standalone module so Astro components and browser scripts can use
 * the same labels without pulling the Zod schema into the client bundle.
 */
export const pricingLabels = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  'contact-sales': 'Contact sales',
} as const;

export type Pricing = keyof typeof pricingLabels;

export const pricingValues = Object.keys(pricingLabels) as [Pricing, ...Pricing[]];
