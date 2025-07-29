// build.js
const esbuild = require('esbuild');
const { readFileSync, statSync } = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const enableWatch = args.includes('--watch');
const enableEsm = args.includes('--esm');
const enableCjs = args.includes('--cjs');
const enableBrowser = args.includes('--browser');
const enableMinify = args.includes('--minify');
const enableSourcemap = args.includes('--sourcemap');

if (!enableEsm && !enableCjs && !enableBrowser) {
  // Default to cjs and esm
  args.push('--esm');
  args.push('--cjs');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: enableMinify,
  sourcemap: enableSourcemap,
  target: ['es2020', 'node18'],
  external: Object.keys(pkg.peerDependencies || {}),
};

const builds = [];
if (enableCjs) {
  builds.push({
    ...baseConfig,
    format: 'cjs',
    outfile: 'dist/index.cjs',
    platform: 'node',
  });
}
if (enableEsm) {
  builds.push({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/index.esm.js',
    platform: 'node',
  });
}
if (enableBrowser) {
  builds.push({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/index.browser.js',
    platform: 'browser',
    globalName: pkg.name.replace(/[-@]/g, ''),
  });
}

async function build() {
  if (builds.length === 0) {
    console.error('No build formats specified.');
    process.exit(1);
  }

  console.log('Building with esbuild...');
  console.log('Formats:', builds.map((b) => b.format).join(', '));
  console.log('Minify:', enableMinify);
  console.log('Sourcemap:', enableSourcemap);

  try {
    if (enableWatch) {
      console.log('Watching for changes...');
      const contexts = await Promise.all(builds.map((c) => esbuild.context(c)));
      await Promise.all(contexts.map((ctx) => ctx.watch()));
    } else {
      await Promise.all(builds.map((c) => esbuild.build(c)));
      console.log('Build completed successfully!');
      builds.forEach((c) => {
        try {
          const stats = statSync(c.outfile);
          console.log(`${path.basename(c.outfile)}: ${(stats.size / 1024).toFixed(1)}kb`);
        } catch {}
      });
    }
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
