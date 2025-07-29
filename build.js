// build.js
const esbuild = require('esbuild');
const { readFileSync } = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Get package.json info
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  target: ['es2020', 'node18'],
  external: Object.keys(pkg.peerDependencies || {}),
};

const builds = [
  // CommonJS build
  {
    ...baseConfig,
    format: 'cjs',
    outfile: 'dist/index.cjs',
    platform: 'node',
  },
  // ESM build
  {
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/index.esm.js',
    platform: 'node',
  },
  // Browser build (optional)
  {
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/index.browser.js',
    platform: 'browser',
    globalName: pkg.name.replace(/[-@]/g, ''),
  },
];

async function build() {
  try {
    if (builds.length === 0) {
      console.log('❌ No build formats specified. Use --esm, --cjs, or --browser flags.');
      process.exit(1);
    }

    console.log(`🔨 Building with esbuild...`);
    console.log(`📦 Formats: ${builds.map(b => b.format).join(', ')}`);
    console.log(`🗜️  Minify: ${enableMinify ? 'enabled' : 'disabled'}`);
    console.log(`🗺️  Sourcemap: ${enableSourcemap ? 'enabled' : 'disabled'}`);
    
    if (isWatch) {
      console.log('👀 Watching for changes...');
      const contexts = await Promise.all(
        builds.map(config => esbuild.context(config))
      );
      await Promise.all(contexts.map(ctx => ctx.watch()));
    } else {
      await Promise.all(builds.map(config => esbuild.build(config)));
      console.log('✅ Build completed successfully!');
      
      // Log bundle sizes
      builds.forEach(config => {
        try {
          const stats = require('fs').statSync(config.outfile);
          console.log(`📦 ${path.basename(config.outfile)}: ${(stats.size / 1024).toFixed(1)}kb`);
        } catch (e) {
          // File might not exist
        }
      });
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();