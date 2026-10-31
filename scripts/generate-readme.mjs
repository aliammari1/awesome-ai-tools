import { readFile, writeFile } from 'node:fs/promises';
import { readCatalog } from './catalog.mjs';
import { listedTools } from '../src/lib/catalog-schema.ts';

const escapeText = (s) => s.replace(/[\\`*_[\]<>]/g, '\\$&');
const linkUrl = (url) =>
  url.replace(/[()<>]/g, (char) =>
    encodeURIComponent(char).replace('(', '%28').replace(')', '%29'),
  );
const headingAnchor = (s) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\- ]/g, '')
    .replace(/ /g, '-')
    .replace(/^-|-$/g, '');
const { tools: allTools, categories } = await readCatalog();
const tools = listedTools(allTools);

const toolCountText = tools.length >= 400 ? '400+' : tools.length;
const lines = [
  '# Awesome AI Tools [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)',
  '',
  `> A curated catalog of **${toolCountText} AI tools** across **${categories.length} categories**.`,
  '> Browse the searchable directory at **https://docs.aliammari.dev**.',
  '',
  'Find AI tools by task, then compare recorded pricing and open-source information in the [searchable directory](https://docs.aliammari.dev/en/). Unknown metadata stays unknown.',
  '',
  'Choose a category below, [suggest a tool](https://github.com/aliammari1/awesome-ai-tools/issues/new?template=tool_addition.yml), or read our [curation methodology](https://docs.aliammari.dev/en/about/methodology/) and [security policy](SECURITY.md).',
  '',
  '## Contents',
  '',
];

for (const category of categories)
  lines.push(`- [${escapeText(category.name)}](#${headingAnchor(category.name)})`);
lines.push('');

for (const category of categories) {
  const categoryTools = tools.filter((tool) => tool.category === category.id);
  lines.push(`## ${escapeText(category.name)}`, '', escapeText(category.description), '');

  const subNames = [];
  for (const tool of categoryTools) {
    if (tool.subcategory && !subNames.includes(tool.subcategory.name))
      subNames.push(tool.subcategory.name);
  }

  const direct = categoryTools.filter((tool) => !tool.subcategory);
  for (const tool of direct)
    lines.push(
      `- [${escapeText(tool.name)}](${linkUrl(tool.url)}) - ${escapeText(tool.description)}`,
    );
  if (direct.length) lines.push('');

  for (const subName of subNames) {
    lines.push(`### ${escapeText(subName)}`, '');
    for (const tool of categoryTools.filter((entry) => entry.subcategory?.name === subName)) {
      lines.push(
        `- [${escapeText(tool.name)}](${linkUrl(tool.url)}) - ${escapeText(tool.description)}`,
      );
    }
    lines.push('');
  }
}

lines.push(
  '## Contributing',
  '',
  'See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines. New and updated tools belong in `catalog/tools/`; run `bun run new:tool` to use the interactive tool wizard, or `bun run generate:readme` to regenerate this README and `bun run check:pr` before submitting. CI validates the catalog, tests, typechecks, and builds the project; external link reports assist human review.',
  '',
  '**License:** [CC0 1.0 Universal](LICENSE).',
  '',
);

const output = lines.join('\n');
const target = new URL('../README.md', import.meta.url);

if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8');
  if (current !== output) {
    console.error('README.md is out of date. Run: bun run generate:readme');
    process.exit(1);
  }
  console.log('README.md matches the structured catalog.');
} else {
  await writeFile(target, output);
  console.log(`Generated README.md from ${tools.length} tools.`);
}
