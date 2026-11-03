import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('scripts/new-tool.mjs --help prints usage instructions', () => {
  const result = spawnSync('bun', ['scripts/new-tool.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--name/);
  assert.match(result.stdout, /--category/);
});

test('scripts/new-tool.mjs fails gracefully when missing required arguments', () => {
  const result = spawnSync('bun', ['scripts/new-tool.mjs', '--name', 'MissingFields'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /required/i);
});

test('scripts/new-tool.mjs rejects invalid category before writing file', () => {
  const result = spawnSync(
    'bun',
    [
      'scripts/new-tool.mjs',
      '--name',
      'Test Tool',
      '--url',
      'https://example.com/test-tool',
      '--desc',
      'A valid description for testing purposes.',
      '--category',
      'non-existent-category',
    ],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown category "non-existent-category"/);
});

test('scripts/new-tool.mjs rejects invalid --open-source value', () => {
  const result = spawnSync(
    'bun',
    [
      'scripts/new-tool.mjs',
      '--name',
      'Test Tool',
      '--url',
      'https://example.com/test-tool',
      '--desc',
      'A valid description for testing purposes.',
      '--category',
      'productivity',
      '--open-source',
      'invalid-value',
    ],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--open-source must be true or false/);
});

test('scripts/audit-catalog.mjs runs successfully and outputs catalog metrics', () => {
  const result = spawnSync('bun', ['scripts/audit-catalog.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /=== Awesome AI Tools: Catalog Audit ===/);
  assert.match(result.stdout, /Metadata Enrichment/);
  assert.match(result.stdout, /Hygiene & Security/);
});
