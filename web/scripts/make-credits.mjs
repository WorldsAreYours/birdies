#!/usr/bin/env node
/**
 * Write (or verify) the attribution that ships beside the audio.
 *
 *   node scripts/make-credits.mjs            # regenerate public/audio/CREDITS.txt
 *   node scripts/make-credits.mjs --check    # fail if the file on disk is stale
 *
 * `--check` runs from `prebuild`, so `npm run build` (and therefore `npm run
 * check`) refuses to bundle a clip whose credit no longer matches the record.
 * The text itself is produced by `src/species/credits.ts` from the record's own
 * `recordist`/`license`/`sourceUrl` fields — nothing here is typed twice.
 *
 * It loads the TypeScript through Vite's own module runner rather than importing
 * it directly, because the repo is bundler-ESM (`.js` suffixes on `.ts` files) and
 * Node cannot resolve those on its own.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const web = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(web, 'public', 'audio', 'CREDITS.txt');
const check = process.argv.includes('--check');

const server = await createServer({
  root: web,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true },
});

try {
  const { catalogue } = await server.ssrLoadModule('/src/species/catalog.ts');
  const { creditsText } = await server.ssrLoadModule('/src/species/credits.ts');
  const text = creditsText(catalogue);

  let existing = null;
  try {
    existing = await readFile(target, 'utf8');
  } catch {
    // absent is a legitimate state on a first run; --check treats it as stale
  }

  if (check) {
    if (existing !== text) {
      console.error(
        `credits are stale: ${target} does not match the species records.\n` +
          'Run `npm run credits` and commit the result — the CC BY-SA clips must ship with the credit that matches them.',
      );
      process.exitCode = 1;
    } else {
      console.log(`credits ok (${target})`);
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
    console.log(`wrote ${target} (${text.length} bytes)`);
  }
} finally {
  await server.close();
}
