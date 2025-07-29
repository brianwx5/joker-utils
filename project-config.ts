import { TextFile, typescript } from 'projen'

export function configureHusky(project: typescript.TypeScriptProject) {
  const preCommitHook = `# Run in parallel for speed\nnpm-run-all --parallel lint:fix format test:quick\n`
  new TextFile(project, '.husky/pre-commit', {
    lines: [preCommitHook],
    executable: true,
  })

  const prePushHook = `npm run lint\n`
  new TextFile(project, '.husky/pre-push', {
    lines: [prePushHook],
    executable: true,
  })

  const huskyCmd = 'husky'
  project.addTask('husky:init', { exec: huskyCmd })
  const currentPrepTask = project.tasks.tryFind('prepare')
  if (!currentPrepTask) {
    project.addTask('prepare', { exec: huskyCmd })
  } else {
    currentPrepTask.exec(huskyCmd)
  }
  project.addPackageIgnore('.husky/')
}

export function configureESLint(project: typescript.TypeScriptProject) {
  project.eslint?.addPlugins('simple-import-sort')
  project.eslint?.addExtends('plugin:@typescript-eslint/recommended')
  project.eslint?.addRules({
    semi: ['off'],
    'import/order': ['off'],
    'import/no-unresolved': ['off'],
    '@typescript-eslint/consistent-type-imports': ['off'],
    'simple-import-sort/imports': ['error'],
    'simple-import-sort/exports': ['error'],
    '@typescript-eslint/no-misused-promises': ['error'],
    'no-duplicate-imports': ['error'],
    '@typescript-eslint/no-shadow': ['warn'],
    '@typescript-eslint/return-await': ['warn'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
  })
  project.eslint?.allowDevDeps('**/?(*.)+(spec|test).+(ts|tsx|js)')
  project.eslint?.allowDevDeps('**/test/**')
}

export function configurePrettier(project: typescript.TypeScriptProject) {
  project.addDevDeps('eslint-plugin-prettier@^5.0.1')
  project.addDevDeps('prettier@^3.0.0')
}

export function configureNvmrc(project: typescript.TypeScriptProject, version = '22.0.0') {
  new TextFile(project, '.nvmrc', {
    lines: [version],
  })
}

export function configureDualTsconfigs(project: typescript.TypeScriptProject) {
  new TextFile(project, 'tsconfig.esm.json', {
    lines: [
      '{',
      '  "extends": "./tsconfig.json",',
      '  "compilerOptions": {',
      '    "outDir": "lib/esm",',
      '    "module": "ESNext",',
      '    "moduleResolution": "node"',
      '  }',
      '}',
    ],
  })
  new TextFile(project, 'tsconfig.cjs.json', {
    lines: [
      '{',
      '  "extends": "./tsconfig.json",',
      '  "compilerOptions": {',
      '    "outDir": "lib/cjs",',
      '    "module": "CommonJS"',
      '  }',
      '}',
    ],
  })
}
