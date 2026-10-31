import { readCatalog } from './catalog.mjs';

try {
  const { tools, categories } = await readCatalog();
  console.log(`Catalog valid: ${tools.length} tools across ${categories.length} categories.`);
} catch (error) {
  console.error(`Catalog validation failed:\n${error.message}`);
  process.exitCode = 1;
}
