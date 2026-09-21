import { readdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const toolsDir = new URL('../catalog/tools/', import.meta.url);
const categoriesDir = new URL('../catalog/categories/', import.meta.url);

const slugify = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const readJsonDir = async (dir) => {
  const names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(names.map(async (name) => ({
    id: name.replace(/\.json$/, ''),
    ...(JSON.parse(await readFile(new URL(name, dir), 'utf8'))),
  })));
};

const [toolsRaw, categoriesRaw] = await Promise.all([readJsonDir(toolsDir), readJsonDir(categoriesDir)]);
const tools = toolsRaw.sort((a, b) => a.order - b.order);
const categories = categoriesRaw.sort((a, b) => a.order - b.order);

const lines = [
  '# Awesome AI Tools [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)',
  '',
  `> A curated catalog of **${tools.length} AI tools** across **${categories.length} categories**.`,
  '> Browse the searchable directory at **https://docs.aliammari.dev**.',
  '',
  'The catalog source of truth is `catalog/tools/*.json`. This README is generated from that structured catalog; edit catalog records instead of editing tool entries here.',
  '',
  '## Contents',
  '',
];

for (const category of categories) lines.push(`- [${category.name}](#${headingAnchor(category.name)})`);
lines.push('');

for (const category of categories) {
  const categoryTools = tools.filter((tool) => tool.category === category.id);
  lines.push(`## ${category.name}`, '', category.description, '');

  const subNames = [];
  for (const tool of categoryTools) {
    if (tool.subcategory && !subNames.includes(tool.subcategory.name)) subNames.push(tool.subcategory.name);
  }

  const direct = categoryTools.filter((tool) => !tool.subcategory);
  for (const tool of direct) lines.push(`- [${tool.name}](${tool.url}) - ${tool.description}`);
  if (direct.length) lines.push('');

  for (const subName of subNames) {
    lines.push(`### ${subName}`, '');
    for (const tool of categoryTools.filter((entry) => entry.subcategory?.name === subName)) {
      lines.push(`- [${tool.name}](${tool.url}) - ${tool.description}`);
    }
    lines.push('');
  }
}

lines.push(
  '## Contributing', '',
  'See [CONTRIBUTING.md](CONTRIBUTING.md). New and updated tools belong in `catalog/tools/`; CI validates the catalog, regenerates this README, checks links, and builds the site.',
  '',
  '**License:** [CC0 1.0 Universal](LICENSE).', ''
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
