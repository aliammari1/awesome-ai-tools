import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const toolsDir = new URL('../catalog/tools/', import.meta.url);
const categoriesDir = new URL('../catalog/categories/', import.meta.url);

const readJsonDir = async (dir) => {
  const names = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(names.map(async (name) => ({
    id: name.replace(/\.json$/, ''),
    data: JSON.parse(await readFile(new URL(name, dir), 'utf8')),
  })));
};

const [tools, categories] = await Promise.all([readJsonDir(toolsDir), readJsonDir(categoriesDir)]);
const categoryIds = new Set(categories.map((entry) => entry.id));
const urls = new Map();
const errors = [];

for (const { id, data } of tools) {
  if (!data.name || typeof data.name !== 'string') errors.push(`${id}: missing name`);
  if (!data.description || data.description.length < 10) errors.push(`${id}: description is too short`);
  try {
    const parsed = new URL(data.url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
  } catch {
    errors.push(`${id}: invalid URL ${data.url}`);
  }
  if (!categoryIds.has(data.category)) errors.push(`${id}: unknown category ${data.category}`);
  if (!Number.isInteger(data.order) || data.order < 0) errors.push(`${id}: order must be a non-negative integer`);
  if (![true, false, null].includes(data.openSource)) errors.push(`${id}: openSource must be true, false, or null`);
  if (![null, 'free', 'freemium', 'paid', 'contact-sales'].includes(data.pricing)) errors.push(`${id}: unsupported pricing value`);

  const normalized = String(data.url || '').replace(/\/$/, '').toLowerCase();
  if (urls.has(normalized)) errors.push(`${id}: duplicate URL also used by ${urls.get(normalized)}`);
  else urls.set(normalized, id);
}

const categoryOrders = new Set();
for (const { id, data } of categories) {
  if (!data.name || !data.description) errors.push(`${id}: category needs name and description`);
  if (categoryOrders.has(data.order)) errors.push(`${id}: duplicate category order ${data.order}`);
  categoryOrders.add(data.order);
}

if (errors.length) {
  console.error(`Catalog validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Catalog valid: ${tools.length} tools across ${categories.length} categories.`);
