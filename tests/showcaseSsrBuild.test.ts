import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';
import { build } from 'vite';

const outputDirectories: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  await Promise.all(
    outputDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('showcase SSR build', () => {
  it('server-renders runtime-compiled demos with one Vue runtime', async () => {
    const outDir = await mkdtemp(resolve('.i9k-showcase-ssr-'));
    outputDirectories.push(outDir);

    const result = await build({
      configFile: resolve('showcase/vite.config.ts'),
      logLevel: 'silent',
      build: {
        emptyOutDir: true,
        outDir,
        ssr: resolve('showcase/entry-server.ts'),
        rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } },
      },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((buildResult) =>
      'output' in buildResult ? buildResult.output : [],
    );
    const entry = outputs.find((output) => output.type === 'chunk' && output.isEntry);
    if (!entry) throw new Error('Vite did not emit a showcase SSR entry chunk');

    const entryUrl = pathToFileURL(join(outDir, entry.fileName)).href;
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        'const server = await import(process.argv[1]); process.stdout.write(JSON.stringify(await server.render()));',
        entryUrl,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    const { html, teleports } = JSON.parse(stdout);

    expect(html).toContain('showcase-demo-stage');
    // The live I9kNavMenu demo teleports its panel to <body>; losing it breaks hydration.
    expect(teleports.body).toContain('<!--teleport start anchor-->');
  });
});
