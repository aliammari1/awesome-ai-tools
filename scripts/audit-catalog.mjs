import { readCatalog } from './catalog.mjs';

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'aff',
  'affiliate',
  'gclid',
  'fbclid',
  'source',
];

const FLUFF_WORDS = [
  '\\bbest\\b',
  "\\bworld's\\s+(?:best|first|leading)\\b",
  '\\b#1\\b',
  '\\bnumber\\s+one\\b',
  '\\brevolutionary\\b',
  '\\bgame[- ]changer\\b',
  '\\bultimate\\b',
  '\\bunmatched\\b',
  '\\bunrivaled\\b',
];

try {
  const { tools, categories } = await readCatalog();
  console.log(`\n=== Awesome AI Tools: Catalog Audit ===`);
  console.log(`Total Tools: ${tools.length} across ${categories.length} categories\n`);

  let nullPricing = 0;
  const pricingCounts = {};
  let nullOpenSource = 0;
  let openSourceCount = 0;
  let closedSourceCount = 0;
  let nullSubcategory = 0;
  let httpUrls = 0;
  const trackingWarnings = [];
  const fluffWarnings = [];
  const punctuationWarnings = [];
  const lengthWarnings = [];
  const categoryCounts = {};

  for (const cat of categories) {
    categoryCounts[cat.id] = 0;
  }

  for (const tool of tools) {
    categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1;

    // Pricing
    if (tool.pricing === null) {
      nullPricing++;
    } else {
      pricingCounts[tool.pricing] = (pricingCounts[tool.pricing] || 0) + 1;
    }

    // Open Source
    if (tool.openSource === null) {
      nullOpenSource++;
    } else if (tool.openSource === true) {
      openSourceCount++;
    } else {
      closedSourceCount++;
    }

    // Subcategory
    if (!tool.subcategory) {
      nullSubcategory++;
    }

    // URL checks
    try {
      const u = new URL(tool.url);
      if (u.protocol === 'http:') {
        httpUrls++;
      }
      for (const param of TRACKING_PARAMS) {
        if (u.searchParams.has(param)) {
          trackingWarnings.push(`${tool.id}: URL contains tracking query parameter '?${param}='`);
        }
      }
    } catch {
      // url validation already caught in schema
    }

    // Description quality
    const desc = tool.description.trim();
    if (!desc.endsWith('.') && !desc.endsWith('!') && !desc.endsWith('?')) {
      punctuationWarnings.push(`${tool.id}: Description does not end with terminal punctuation.`);
    }

    for (const fluffPattern of FLUFF_WORDS) {
      const regex = new RegExp(fluffPattern, 'i');
      if (regex.test(desc)) {
        fluffWarnings.push(
          `${tool.id}: Description may contain promotional puffery matching '${fluffPattern}'.`,
        );
      }
    }

    if (desc.length < 25) {
      lengthWarnings.push(
        `${tool.id}: Description is very short (${desc.length} chars). Consider expanding.`,
      );
    } else if (desc.length > 250) {
      lengthWarnings.push(
        `${tool.id}: Description is very long (${desc.length} chars). Aim for one concise sentence.`,
      );
    }
  }

  // Summary Metrics
  console.log(`--- Metadata Enrichment ---`);
  console.log(
    `Pricing specified:     ${tools.length - nullPricing}/${tools.length} (${(((tools.length - nullPricing) / tools.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Breakdown: ${Object.entries(pricingCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')}`,
  );
  console.log(
    `Open Source specified: ${tools.length - nullOpenSource}/${tools.length} (${(((tools.length - nullOpenSource) / tools.length) * 100).toFixed(1)}%) [OSS: ${openSourceCount}, Proprietary: ${closedSourceCount}]`,
  );
  console.log(
    `Subcategory assigned:  ${tools.length - nullSubcategory}/${tools.length} (${(((tools.length - nullSubcategory) / tools.length) * 100).toFixed(1)}%)`,
  );

  console.log(`\n--- Hygiene & Security ---`);
  console.log(`HTTP URLs (not HTTPS): ${httpUrls}`);
  console.log(`Tracking parameters:   ${trackingWarnings.length}`);
  if (trackingWarnings.length > 0) {
    for (const tw of trackingWarnings.slice(0, 5)) console.log(`  ! ${tw}`);
    if (trackingWarnings.length > 5) console.log(`  ...and ${trackingWarnings.length - 5} more`);
  }

  console.log(`\n--- Editorial Quality ---`);
  console.log(`Missing period:        ${punctuationWarnings.length}`);
  if (punctuationWarnings.length > 0) {
    for (const pw of punctuationWarnings.slice(0, 5)) console.log(`  ! ${pw}`);
    if (punctuationWarnings.length > 5)
      console.log(`  ...and ${punctuationWarnings.length - 5} more`);
  }
  console.log(`Fluff / superlatives:  ${fluffWarnings.length}`);
  if (fluffWarnings.length > 0) {
    for (const fw of fluffWarnings.slice(0, 5)) console.log(`  ! ${fw}`);
    if (fluffWarnings.length > 5) console.log(`  ...and ${fluffWarnings.length - 5} more`);
  }
  console.log(`Length anomalies:      ${lengthWarnings.length}`);

  console.log(`\n--- Category Distribution ---`);
  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat.padEnd(35)} : ${count} tools`);
  }

  console.log(`\n✓ Catalog audit complete.`);
} catch (error) {
  console.error(`Audit failed: ${error.message}`);
  process.exitCode = 1;
}
