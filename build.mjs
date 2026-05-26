import { build } from 'esbuild';

// Side Panel — ESM with code splitting
await build({
  entryPoints: ['sidepanel/app.js'],
  bundle: true,
  format: 'esm',
  outdir: 'lib',
  splitting: true,
  sourcemap: true,
});

// Content Script — IIFE, self-contained bundle (no splitting)
await build({
  entryPoints: ['content/content-script.js'],
  bundle: true,
  format: 'iife',
  outfile: 'lib/content-bundle.js',
  sourcemap: true,
});

console.log('Build complete');
