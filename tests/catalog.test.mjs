import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { listedTools } from '../src/lib/catalog-schema.ts';

const root = new URL('../', import.meta.url);
const tool = {
  name: 'Example Tool',
  url: 'https://example.com/Tool',
  description: 'A useful tool for testing the catalog.',
  category: 'testing',
  subcategory: null,
  order: 1,
  openSource: null,
  pricing: null,
  status: 'listed',
  source: { kind: 'readme-migration', migratedAt: '2026-09-21' },
};

test('public selection hides discontinued and deprecated records', () => {
  const result = listedTools([
    { id: 'active', status: 'listed' },
    { id: 'retired', status: 'discontinued' },
    { id: 'old', status: 'deprecated' },
  ]);
  assert.deepEqual(
    result.map(({ id }) => id),
    ['active'],
  );
});

async function fixture(t, records) {
  const dir = await mkdtemp(path.join(tmpdir(), 'catalog-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(new URL('scripts', root), path.join(dir, 'scripts'), { recursive: true });
  await cp(new URL('src', root), path.join(dir, 'src'), { recursive: true });
  // Resolve installed dependencies without copying their contents.
  const { symlink } = await import('node:fs/promises');
  await symlink(fileURLToPath(new URL('node_modules', root)), path.join(dir, 'node_modules'));
  await mkdir(path.join(dir, 'catalog/tools'), { recursive: true });
  await mkdir(path.join(dir, 'catalog/categories'), { recursive: true });
  await writeFile(
    path.join(dir, 'catalog/categories/testing.json'),
    JSON.stringify({ name: 'Testing', description: 'Tools for testing.', order: 1 }),
  );
  for (const [id, record] of Object.entries(records)) {
    await writeFile(path.join(dir, `catalog/tools/${id}.json`), JSON.stringify(record));
  }
  return {
    dir,
    run: (script, ...args) =>
      spawnSync('bun', [`scripts/${script}.mjs`, ...args], { cwd: dir, encoding: 'utf8' }),
  };
}

test('accepts existing migration records and honest community provenance', async (t) => {
  const f = await fixture(t, {
    example: tool,
    new: {
      ...tool,
      name: 'New Tool',
      url: 'https://other.example.org/',
      source: { kind: 'community', addedAt: '2026-10-19' },
    },
  });
  const result = f.run('validate-catalog');
  assert.equal(result.status, 0, result.stderr);
});

for (const [name, changes] of [
  ['invalid status', { status: 'approved' }],
  ['invalid provenance date', { source: { kind: 'community', addedAt: '2026-02-31' } }],
  ['non-string description', { description: 1234567890 }],
  ['unknown fields', { affiliate: 'hidden' }],
  ['private IP URL', { url: 'http://127.0.0.1/admin' }],
  ['IPv6 URL', { url: 'http://[::1]/' }],
  ['credential-bearing URL', { url: 'https://user:password@example.com/' }],
  ['insecure HTTP URL', { url: 'http://example.com/tool' }],
  ['local hostname', { url: 'https://service.internal/' }],
  ['malformed URL', { url: 'not a URL' }],
  ['script URL', { url: 'javascript:alert(1)' }],
  ['tracking query parameter', { url: 'https://example.com/tool?utm_source=twitter' }],
  ['utm_campaign query parameter', { url: 'https://example.com/tool?utm_campaign=spring' }],
  ['affiliate query parameter', { url: 'https://example.com/tool?ref=partner123' }],
  ['fbclid tracking parameter', { url: 'https://example.com/tool?fbclid=abc123xyz' }],
]) {
  test(`rejects ${name}`, async (t) => {
    const f = await fixture(t, { example: { ...tool, ...changes } });
    const result = f.run('validate-catalog');
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, /example/);
  });
}

test('accepts legitimate URL fragments and functional query parameters', async (t) => {
  const f = await fixture(t, {
    'with-anchor': {
      ...tool,
      name: 'Tool With Anchor',
      url: 'https://github.com/example/tool#readme',
    },
    'with-query': {
      ...tool,
      name: 'Tool With Query',
      url: 'https://example.com/docs?lang=en&tab=quickstart',
    },
  });
  const result = f.run('validate-catalog');
  assert.equal(result.status, 0, result.stderr);
});

test('URL duplicate detection preserves case-sensitive paths', async (t) => {
  const f = await fixture(t, {
    one: tool,
    two: { ...tool, name: 'Example Tool Two', url: 'https://example.com/tool' },
  });
  const result = f.run('validate-catalog');
  assert.equal(result.status, 0, result.stderr);
});

test('rejects duplicate canonical URLs and unknown categories', async (t) => {
  const f = await fixture(t, {
    one: tool,
    two: { ...tool, url: 'https://EXAMPLE.com/Tool/', category: 'missing' },
  });
  const result = f.run('validate-catalog');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate URL/);
  assert.match(result.stderr, /unknown category/);
});

test('rejects duplicate tool names within the same category', async (t) => {
  const f = await fixture(t, {
    first: { ...tool, name: 'Duplicate Name' },
    second: { ...tool, name: 'duplicate name', url: 'https://example.com/other-url' },
  });
  const result = f.run('validate-catalog');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate tool name/i);
});

test('README omits discontinued destinations and escapes catalog markdown', async (t) => {
  const f = await fixture(t, {
    example: { ...tool, name: 'Example [tool]', description: 'Use *literal* text for this tool.' },
    unsafe: { ...tool, name: 'Unsafe', url: 'https://unsafe.example.org/', status: 'discontinued' },
  });
  const result = f.run('generate-readme');
  assert.equal(result.status, 0, result.stderr);
  const readme = await readFile(path.join(f.dir, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /unsafe\.example/);
  assert.ok(readme.includes('Example \\[tool\\]'));
  assert.ok(readme.includes('Use \\*literal\\* text'));
  assert.equal(f.run('generate-readme', '--check').status, 0);
  await writeFile(path.join(f.dir, 'README.md'), 'out of date');
  assert.notEqual(f.run('generate-readme', '--check').status, 0);
});

test('built website excludes retired routes and outbound destinations', async (t) => {
  const f = await fixture(t, {
    example: tool,
    unsafe: { ...tool, name: 'Unsafe', url: 'https://unsafe.example.org/', status: 'discontinued' },
  });
  await cp(new URL('astro.config.mjs', root), path.join(f.dir, 'astro.config.mjs'));
  const result = spawnSync(
    'node',
    [fileURLToPath(new URL('node_modules/astro/bin/astro.mjs', root)), 'build', '--root', f.dir],
    {
      cwd: f.dir,
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    },
  );
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const dist = path.join(f.dir, 'dist');
  const files = await readdir(dist, { recursive: true });
  assert.ok(files.includes(path.join('en', 'tools', 'example', 'index.html')));
  assert.ok(!files.some((file) => file.includes('/unsafe/')));
  for (const file of files.filter((file) => /\.(html|xml)$/.test(file))) {
    assert.doesNotMatch(
      await readFile(path.join(dist, file), 'utf8'),
      /unsafe\.example\.org/,
      file,
    );
  }
});

test('issue template category options match catalog/categories', async () => {
  const categoryFiles = await readdir(new URL('../catalog/categories', import.meta.url));
  const categoryIds = categoryFiles
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
  const templateContent = await readFile(
    new URL('../.github/ISSUE_TEMPLATE/tool_addition.yml', import.meta.url),
    'utf8',
  );
  for (const id of categoryIds) {
    assert.ok(
      templateContent.includes(`- ${id}`),
      `Category "${id}" missing from .github/ISSUE_TEMPLATE/tool_addition.yml`,
    );
  }
});
