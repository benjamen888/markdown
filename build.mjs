import { build } from 'esbuild';

await build({
  entryPoints: ['sidepanel/app.js'],
  bundle: true,
  format: 'esm',
  outfile: 'lib/sidepanel-bundle.js',
  sourcemap: true,
});
console.log('Build complete');
