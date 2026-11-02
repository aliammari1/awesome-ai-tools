import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const script = resolve('scripts/changed-links.mjs');

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), 'changed-links-'));
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  const write = (name, url) => {
    mkdirSync(join(directory, 'catalog/tools'), { recursive: true });
    writeFileSync(join(directory, 'catalog/tools', name), JSON.stringify({ name, url }));
  };
  try {
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    run({ directory, git, write });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('extracts only new and changed catalog destinations', () =>
  fixture(({ directory, git, write }) => {
    write('unchanged.json', 'https://example.com/unchanged');
    write('changed.json', 'https://example.com/old');
    write('deleted.json', 'https://example.com/deleted');
    git('add', '.');
    git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');

    write('changed.json', 'https://example.com/new');
    write('added.json', 'https://example.com/added');
    rmSync(join(directory, 'catalog/tools/deleted.json'));
    writeFileSync(join(directory, 'README.md'), 'https://example.com/not-a-tool');
    git('add', '-A');
    git('commit', '-qm', 'head');

    const output = join(directory, 'urls.txt');
    const result = spawnSync(process.execPath, [script, base, 'HEAD', output], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(output, 'utf8'),
      'https://example.com/added\nhttps://example.com/new\n',
    );
  }));

test('fails visibly for an invalid catalog URL or missing base', () =>
  fixture(({ directory, git, write }) => {
    write('added.json', 'https://example.com/added');
    git('add', '.');
    git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    write('added.json', 'javascript:alert(1)');
    git('add', '.');
    git('commit', '-qm', 'head');

    const output = join(directory, 'urls.txt');
    const invalid = spawnSync(process.execPath, [script, base, 'HEAD', output], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Invalid catalog URL/);

    const badBase = spawnSync(process.execPath, [script, 'missing-ref', 'HEAD', output], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(badBase.status, 1);
  }));

test('uses merge-base when base branch has advanced', () =>
  fixture(({ directory, git, write }) => {
    write('common.json', 'https://example.com/common');
    git('add', '.');
    git('commit', '-qm', 'initial');

    git('checkout', '-qb', 'feature');
    write('pr-tool.json', 'https://example.com/pr-tool');
    git('add', '.');
    git('commit', '-qm', 'add pr tool');

    git('checkout', '-q', '-');
    write('main-tool.json', 'https://example.com/main-tool');
    git('add', '.');
    git('commit', '-qm', 'add tool on main');

    const output = join(directory, 'urls.txt');
    const result = spawnSync(process.execPath, [script, 'HEAD', 'feature', output], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'https://example.com/pr-tool\n');
  }));
