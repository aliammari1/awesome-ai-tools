import { readdir, readFile } from 'node:fs/promises';
import { toolSchema, categorySchema, slugSchema } from '../src/lib/catalog-schema.ts';

async function readRecords(directory, schema) {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(
    names.map(async (name) => {
      const id = name.slice(0, -5);
      try {
        slugSchema.parse(id);
        const data = schema.parse(JSON.parse(await readFile(new URL(name, directory), 'utf8')));
        return { id, ...data };
      } catch (error) {
        throw new Error(`${directory.pathname}${name}: ${error.message}`, { cause: error });
      }
    }),
  );
}

export async function readCatalog() {
  const [tools, categories] = await Promise.all([
    readRecords(new URL('../catalog/tools/', import.meta.url), toolSchema),
    readRecords(new URL('../catalog/categories/', import.meta.url), categorySchema),
  ]);
  const categoryIds = new Set(categories.map(({ id }) => id));
  const urls = new Map();
  const namesByCategory = new Map();
  const subcategories = new Map();
  const orders = new Set();
  const errors = [];
  for (const tool of tools) {
    if (!categoryIds.has(tool.category))
      errors.push(`${tool.id}: unknown category ${tool.category}`);
    const url = new URL(tool.url);
    url.hash = '';
    const canonical = url.href.replace(/\/$/, '');
    if (urls.has(canonical))
      errors.push(`${tool.id}: duplicate URL also used by ${urls.get(canonical)}`);
    urls.set(canonical, tool.id);
    const categoryNameKey = `${tool.category}:${tool.name.trim().toLowerCase()}`;
    if (namesByCategory.has(categoryNameKey))
      errors.push(
        `${tool.id}: duplicate tool name "${tool.name}" in category ${tool.category} also used by ${namesByCategory.get(categoryNameKey)}`,
      );
    namesByCategory.set(categoryNameKey, tool.id);
    if (tool.subcategory) {
      const key = `${tool.category}/${tool.subcategory.id}`;
      const previous = subcategories.get(key);
      if (previous && previous !== tool.subcategory.name)
        errors.push(`${tool.id}: inconsistent name for subcategory ${key}`);
      subcategories.set(key, tool.subcategory.name);
    }
  }
  for (const category of categories) {
    if (orders.has(category.order))
      errors.push(`${category.id}: duplicate category order ${category.order}`);
    orders.add(category.order);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const byOrder = (a, b) => a.order - b.order || a.id.localeCompare(b.id, 'en');
  return { tools: tools.sort(byOrder), categories: categories.sort(byOrder) };
}
