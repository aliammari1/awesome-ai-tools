#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [base, head, output] = process.argv.slice(2);

if (!base || !head || !output) {
  console.error('Usage: node scripts/changed-links.mjs <base-sha> <head-sha> <output-file>');
  process.exit(2);
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function catalogUrl(ref, file, required) {
  let contents;
  try {
    contents = git('show', `${ref}:${file}`);
  } catch (error) {
    if (!required) return undefined;
    throw new Error(`Cannot read ${file} at ${ref}`, { cause: error });
  }

  let record;
  try {
    record = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file} at ${ref}`, { cause: error });
  }

  if (typeof record.url !== 'string' || !/^https?:\/\//i.test(record.url)) {
    throw new Error(`Invalid catalog URL in ${file} at ${ref}`);
  }
  return record.url;
}

try {
  // Exit on invalid refs or a failed diff. Shell pipelines can mask these errors.
  git('rev-parse', '--verify', `${base}^{commit}`);
  git('rev-parse', '--verify', `${head}^{commit}`);
  const mergeBase = git('merge-base', base, head).trim();
  const files = git(
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    mergeBase,
    head,
    '--',
    'catalog/tools/',
  );
  const urls = new Set();

  for (const file of files.split('\n').filter((name) => name.endsWith('.json'))) {
    const next = catalogUrl(head, file, true);
    const previous = catalogUrl(mergeBase, file, false);
    if (next !== previous) urls.add(next);
  }

  writeFileSync(
    output,
    [...urls]
      .sort()
      .map((url) => `${url}\n`)
      .join(''),
  );
  console.log(`${urls.size} new or changed catalog URL(s).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
