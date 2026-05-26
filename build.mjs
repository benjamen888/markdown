import { build } from 'esbuild';

await build({
  entryPoints: ['sidepanel/app.js', 'content/content-script.js'],
  bundle: true,
  format: 'esm',
  outdir: 'lib',
  splitting: true,
  sourcemap: true,
});
console.log('Build complete');
