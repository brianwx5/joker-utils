// .projenrc.ts
import { typescript } from 'projen';
import {
  NodePackageManager,
  TrailingComma,
  TypeScriptModuleResolution,
} from 'projen/lib/javascript';

// Configuration functions for different features
function setupHusky(project: typescript.TypeScriptProject) {
  project.addDevDeps('husky', 'lint-staged');

  project.addFields({
    'lint-staged': {
      '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
      '*.{json,md,yml,yaml}': ['prettier --write'],
    },
  });

  project.addTask('setup-husky', {
    exec: 'npx husky install && npx husky add .husky/pre-commit "npx lint-staged" && npx husky add .husky/commit-msg "npx commitlint --edit $1"',
  });

  project.packageTask.env('HUSKY', '0'); // Disable husky in CI

  // Automatically set up git hooks after installing dependencies
  const postInstall = project.tasks.tryFind('post-install');
  if (postInstall) {
    postInstall.spawn(project.tasks.tryFind('setup-husky')!);
  }
}

function setupCommitLint(project: typescript.TypeScriptProject) {
  project.addDevDeps('@commitlint/cli', '@commitlint/config-conventional');

  project.addFields({
    commitlint: {
      extends: ['@commitlint/config-conventional'],
    },
  });
}

function setupBuild(project: typescript.TypeScriptProject) {
  project.addDevDeps('esbuild', 'npm-run-all', 'rimraf', 'ts-node');

  // Add build scripts - using default options for simplified version
  project.addScripts({
    clean: 'rimraf dist lib',
    'build:esbuild': 'node build.js --esm --cjs --minify --sourcemap',
    'build:types': 'tsc --emitDeclarationOnly',
    build: 'npm-run-all clean build:esbuild build:types',
    dev: 'node build.js --esm --cjs --sourcemap --watch',
    size: "node -e \"console.log(require('fs').statSync('dist/index.js').size + ' bytes')\"",
    prepare: 'husky install',
  });
}

function setupDocumentation(project: typescript.TypeScriptProject) {
  project.addDevDeps('typedoc');
  project.addScripts({
    docs: 'typedoc src/index.ts --out docs',
    'docs:serve': 'npx http-server docs -p 8080',
  });
}

function setupSemanticRelease(project: typescript.TypeScriptProject) {
  project.addDevDeps('semantic-release', '@semantic-release/changelog', '@semantic-release/git');

  project.addFields({
    release: {
      branches: ['main'],
      plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        '@semantic-release/git',
        '@semantic-release/github',
      ],
    },
  });
}

function setupPackageFields(project: typescript.TypeScriptProject) {
  project.addFields({
    engines: {
      node: '>=18.0.0',
    },
    main: 'dist/index.cjs',
    module: 'dist/index.esm.js',
    types: 'lib/index.d.ts',
    exports: {
      '.': {
        import: './dist/index.esm.js',
        require: './dist/index.cjs',
        types: './lib/index.d.ts',
      },
    },
    files: ['dist', 'lib'],
    keywords: ['utility', 'typescript', 'library'],
  });
}

function setupTesting(project: typescript.TypeScriptProject) {
  project.addDevDeps('jest-environment-node', '@types/jest');

  project.addScripts({
    'test:coverage': 'jest --coverage',
    'test:watch': 'jest --watch',
  });
}

function setupDevelopmentTools(project: typescript.TypeScriptProject) {
  project.addDevDeps(
    'madge', // Circular dependency detection
    'depcheck', // Unused dependency detection
    'npm-check-updates' // Dependency updates
  );

  project.addScripts({
    'check:deps': 'depcheck',
    'check:circular': 'madge --circular src/',
    'update:deps': 'ncu -u',
  });
}

function setupNodeVersion(project: typescript.TypeScriptProject) {
  project.addTask('post-install', {
    exec: 'echo "18" > .nvmrc',
  });
}

// Main project configuration with ESLint and Prettier configured in constructor
const project = new typescript.TypeScriptProject({
  // Basic project configuration
  name: 'joker',
  description: 'A TypeScript utility library',
  authorName: 'The Joker Team',
  authorEmail: 'your.email@example.com',
  projenrcTs: true,

  // Package configuration
  defaultReleaseBranch: 'main',
  packageManager: NodePackageManager.NPM,
  workflowNodeVersion: '20',

  // Disable npm publishing since you want GitHub only
  releaseToNpm: false,

  // ESLint configuration - must be set in constructor
  eslint: true,
  eslintOptions: {
    prettier: true, // This ensures ESLint works well with Prettier
    dirs: ['src', 'test'],
    fileExtensions: ['.ts', '.tsx'],
  },

  // Prettier configuration - must be set in constructor
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      trailingComma: TrailingComma.ES5,
      tabWidth: 2,
      semi: true,
      printWidth: 100,
    },
  },

  // Jest configuration for testing - must be set in constructor
  jest: true,

  // TypeScript configuration (for type checking and declarations)
  tsconfig: {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020'],
      outDir: 'lib',
      rootDir: 'src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      moduleResolution: TypeScriptModuleResolution.NODE,
    },
  },

  // Git configuration
  gitignore: ['node_modules/', 'lib/', 'dist/', '.env', '.env.local', '*.log', '.DS_Store'],

  // GitHub configuration
  github: true,
  githubOptions: {
    workflows: true,
  },

  // Basic dependencies
  devDeps: ['@types/node', '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser'],
});

// Apply all configurations
setupHusky(project);
setupCommitLint(project);
setupBuild(project);
setupDocumentation(project);
setupSemanticRelease(project);
setupPackageFields(project);
setupTesting(project);
setupDevelopmentTools(project);
setupNodeVersion(project);
project.addDeps('log4js');

// Ensure ts-node compiles with CommonJS for Node 22 compatibility
project.tsconfigDev.addOverride('compilerOptions.module', 'CommonJS');
project.defaultTask?.reset('ts-node --project tsconfig.dev.json .projenrc.ts');

project.synth();
