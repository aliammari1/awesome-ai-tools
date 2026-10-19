import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCatalog } from './catalog.mjs';
import { listedTools } from '../src/lib/catalog-schema.ts';
import { locales } from '../src/lib/locales.ts';

const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url));

const BUDGETS = {
  maxHtmlBytes: 750 * 1024, // 750 KB uncompressed max per page
  maxJsBytes: 150 * 1024, // 150 KB max per JS asset
  maxCssBytes: 100 * 1024, // 100 KB max per CSS asset
  maxTotalDistMb: 150, // total dist output size budget
};

const CORE_ROUTES = [
  'index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'en/index.html',
  'en/about/methodology/index.html',
  'en/contribute/index.html',
  'en/compare/index.html',
  'en/saved/index.html',
];

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

try {
  try {
    await stat(DIST_DIR);
  } catch {
    console.error('Error: dist/ directory not found. Run "bun run build" before checking budget.');
    process.exit(1);
  }

  const { tools: allTools, categories } = await readCatalog();
  const listed = listedTools(allTools);

  const allFiles = await getFiles(DIST_DIR);
  let totalBytes = 0;
  let htmlCount = 0;
  let largestHtml = { path: '', size: 0 };
  let largestJs = { path: '', size: 0 };
  let largestCss = { path: '', size: 0 };
  const violations = [];

  for (const file of allFiles) {
    const { size } = await stat(file);
    totalBytes += size;
    const relPath = file.replace(DIST_DIR + '/', '');

    if (file.endsWith('.html')) {
      htmlCount++;
      if (size > largestHtml.size) largestHtml = { path: relPath, size };
      if (size > BUDGETS.maxHtmlBytes) {
        violations.push(
          `HTML page ${relPath} (${(size / 1024).toFixed(1)} KB) exceeds budget (${BUDGETS.maxHtmlBytes / 1024} KB)`,
        );
      }
    } else if (file.endsWith('.js')) {
      if (size > largestJs.size) largestJs = { path: relPath, size };
      if (size > BUDGETS.maxJsBytes) {
        violations.push(
          `JS bundle ${relPath} (${(size / 1024).toFixed(1)} KB) exceeds budget (${BUDGETS.maxJsBytes / 1024} KB)`,
        );
      }
    } else if (file.endsWith('.css')) {
      if (size > largestCss.size) largestCss = { path: relPath, size };
      if (size > BUDGETS.maxCssBytes) {
        violations.push(
          `CSS bundle ${relPath} (${(size / 1024).toFixed(1)} KB) exceeds budget (${BUDGETS.maxCssBytes / 1024} KB)`,
        );
      }
    }
  }

  const totalMb = totalBytes / (1024 * 1024);
  if (totalMb > BUDGETS.maxTotalDistMb) {
    violations.push(
      `Total build size (${totalMb.toFixed(1)} MB) exceeds budget (${BUDGETS.maxTotalDistMb} MB)`,
    );
  }

  // --- Invariant 1: Core routes exist and are non-empty ---
  for (const route of CORE_ROUTES) {
    const routePath = join(DIST_DIR, route);
    try {
      const s = await stat(routePath);
      if (s.size === 0) violations.push(`Required route ${route} was generated empty (0 bytes)`);
    } catch {
      violations.push(`Required route ${route} was not generated in dist/`);
    }
  }

  // --- Invariant 2: Every category page exists in primary English locale ---
  for (const category of categories) {
    const catRoute = `en/categories/${category.id}/index.html`;
    try {
      const s = await stat(join(DIST_DIR, catRoute));
      if (s.size === 0) violations.push(`Category page ${catRoute} was generated empty (0 bytes)`);
    } catch {
      violations.push(`Category page ${catRoute} was not generated in dist/`);
    }
  }

  // --- Invariant 3: Every listed tool has an individual detail page ---
  for (const tool of listed) {
    const toolRoute = `en/tools/${tool.id}/index.html`;
    try {
      const s = await stat(join(DIST_DIR, toolRoute));
      if (s.size === 0)
        violations.push(`Tool detail page ${toolRoute} was generated empty (0 bytes)`);
    } catch {
      violations.push(`Tool detail page ${toolRoute} was not generated in dist/`);
    }
  }

  // --- Invariant 4: Every configured locale generates an index ---
  for (const loc of locales) {
    const locRoute = `${loc}/index.html`;
    try {
      const s = await stat(join(DIST_DIR, locRoute));
      if (s.size === 0)
        violations.push(`Locale index page ${locRoute} was generated empty (0 bytes)`);
    } catch {
      violations.push(`Locale index page ${locRoute} was not generated in dist/`);
    }
  }

  // --- Invariant 5: Total page count matches expected minimum from catalog ---
  const minRequiredPages = (listed.length + categories.length + 5) * locales.length + 2;
  if (htmlCount < minRequiredPages) {
    violations.push(
      `Generated HTML page count (${htmlCount}) is below catalog minimum (${minRequiredPages} = (${listed.length} tools + ${categories.length} categories + 5 pages) * ${locales.length} locales + 2 root pages)`,
    );
  }

  console.log('--- Build Invariants & Budget Report ---');
  console.log(
    `Catalog tools checked:   ${listed.length} listed (across ${categories.length} categories)`,
  );
  console.log(`Generated HTML pages:    ${htmlCount} (minimum required: ${minRequiredPages})`);
  console.log(
    `Total build size:        ${totalMb.toFixed(2)} MB (budget: ${BUDGETS.maxTotalDistMb} MB)`,
  );
  console.log(
    `Largest HTML page:       ${largestHtml.path} (${(largestHtml.size / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `Largest JS bundle:       ${largestJs.path || 'none'} (${(largestJs.size / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `Largest CSS bundle:      ${largestCss.path || 'none'} (${(largestCss.size / 1024).toFixed(1)} KB)`,
  );

  if (violations.length > 0) {
    console.error('\nBuild invariant / budget violations detected:');
    for (const v of violations) console.error(` ✗ ${v}`);
    process.exit(1);
  } else {
    console.log('\n✓ All catalog invariants and build budgets passed successfully.');
  }
} catch (error) {
  console.error(`Budget check error: ${error.message}`);
  process.exit(1);
}
