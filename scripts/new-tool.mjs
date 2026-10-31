#!/usr/bin/env bun

import { writeFile, access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execFileSync } from 'node:child_process';
import { toolSchema } from '../src/lib/catalog-schema.ts';
import { readCatalog } from './catalog.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
}

function printHelp() {
  console.log(`
Awesome AI Tools - New Tool Generator

Usage:
  bun run new:tool [flags]

Interactive mode:
  bun run new:tool (run with no flags in an interactive terminal)

Flags:
  --name <string>             Tool name (required)
  --url <string>              Official website or repo URL (required)
  --desc, --description <str> Factual 1-sentence description (required)
  --category <string>         Category ID (required, e.g. code-generation-and-development)
  --subcategory-id <string>   Subcategory ID (optional)
  --subcategory-name <string> Subcategory display name (optional)
  --pricing <string>          free | freemium | paid | contact-sales (optional)
  --open-source <bool>        true | false (optional)
  --slug <string>             Custom kebab-case slug (optional, auto-derived from name)
  --force                     Overwrite existing tool record if present
  --help, -h                  Show this help message
`);
}

function toSlug(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function promptUser(question, defaultValue = '') {
  const rl = createInterface({ input: stdin, output: stdout });
  const promptText = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
  const answer = (await rl.question(promptText)).trim();
  rl.close();
  return answer || defaultValue;
}

try {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const { tools, categories } = await readCatalog();
  const categoryIds = categories.map((c) => c.id);

  let name = options.name;
  let url = options.url;
  let description = options.description || options.desc;
  let category = options.category;
  let pricing = options.pricing || null;
  let openSource = null;
  if (options['open-source'] !== undefined) {
    const val = String(options['open-source']).toLowerCase();
    if (val === 'true' || val === 'yes' || val === 'y' || val === '1') openSource = true;
    else if (val === 'false' || val === 'no' || val === 'n' || val === '0') openSource = false;
    else {
      console.error('Error: --open-source must be true or false.');
      process.exit(1);
    }
  }

  const isInteractive = stdin.isTTY && !options.name;

  if (isInteractive) {
    console.log('=== Awesome AI Tools: New Tool Wizard ===\n');
    name = await promptUser('Tool Name');
    url = await promptUser('Official Website or Repository URL');
    description = await promptUser('One-sentence factual description (ends with a period)');

    console.log('\nAvailable Categories:');
    categories.forEach((c, idx) => console.log(`  [${idx + 1}] ${c.id} (${c.name})`));
    const catChoice = await promptUser('Category (name or number)');
    const catIndex = parseInt(catChoice, 10) - 1;
    if (!Number.isNaN(catIndex) && categoryIds[catIndex]) {
      category = categoryIds[catIndex];
    } else {
      category = catChoice;
    }

    const pricingChoice = await promptUser(
      'Pricing model [free, freemium, paid, contact-sales, or leave empty]',
      '',
    );
    if (['free', 'freemium', 'paid', 'contact-sales'].includes(pricingChoice)) {
      pricing = pricingChoice;
    }

    const ossChoice = await promptUser('Is it Open Source? [y/n/leave empty]', '');
    if (ossChoice.toLowerCase() === 'y' || ossChoice.toLowerCase() === 'yes') openSource = true;
    else if (ossChoice.toLowerCase() === 'n' || ossChoice.toLowerCase() === 'no')
      openSource = false;
  }

  if (!name || !url || !description || !category) {
    console.error('Error: name, url, description, and category are required.');
    printHelp();
    process.exit(1);
  }

  if (!categoryIds.includes(category)) {
    console.error(
      `Error: Unknown category "${category}". Valid categories:\n  - ${categoryIds.join('\n  - ')}`,
    );
    process.exit(1);
  }

  // Ensure trailing period on description
  if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
    description = `${description}.`;
  }

  const slug = options.slug || toSlug(name);
  if (!slug) {
    console.error('Could not derive a valid slug from name.');
    process.exit(1);
  }

  const filePath = new URL(`../catalog/tools/${slug}.json`, import.meta.url);

  try {
    await access(filePath);
    if (!options.force) {
      console.error(
        `Error: Tool record already exists at catalog/tools/${slug}.json. Use --force to overwrite.`,
      );
      process.exit(1);
    }
  } catch {
    // File doesn't exist, proceed
  }

  // Check duplicate URL
  const canonicalUrl = url.replace(/\/$/, '').toLowerCase();
  for (const existing of tools) {
    if (existing.url.replace(/\/$/, '').toLowerCase() === canonicalUrl && existing.id !== slug) {
      console.error(`Error: URL is already used by existing tool '${existing.id}'.`);
      process.exit(1);
    }
    if (
      existing.category === category &&
      existing.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      existing.id !== slug
    ) {
      console.error(
        `Error: Tool name "${name}" is already used by '${existing.id}' in category '${category}'. Disambiguate if distinct.`,
      );
      process.exit(1);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const record = {
    name,
    url,
    description,
    category,
    subcategory: options['subcategory-id']
      ? {
          id: options['subcategory-id'],
          name: options['subcategory-name'] || options['subcategory-id'],
        }
      : null,
    order: options.order ? parseInt(options.order, 10) : 9999,
    openSource,
    pricing,
    status: 'listed',
    source: {
      kind: 'community',
      addedAt: today,
    },
  };

  // Validate with Zod
  const validated = toolSchema.parse(record);

  await writeFile(filePath, JSON.stringify(validated, null, 2) + '\n');
  console.log(`\n✓ Created catalog/tools/${slug}.json`);

  // Regenerate README
  console.log('Regenerating README...');
  execFileSync('bun', ['run', 'generate:readme'], { stdio: 'inherit' });

  console.log(`\n✓ Success! Added "${name}" (${slug}).`);
  console.log('Next steps:');
  console.log(`  1. Review the changes in catalog/tools/${slug}.json and README.md.`);
  console.log('  2. Run "bun run check:pr" to verify your submission.');
} catch (error) {
  console.error(`\nFailed to create tool: ${error.message}`);
  process.exit(1);
}
