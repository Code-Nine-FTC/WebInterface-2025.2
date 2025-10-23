import vue from 'eslint-plugin-vue';
import tseslint from '@typescript-eslint/eslint-plugin';

export default [
  // Global ignores (avoid linting build outputs and generated files)
  {
    ignores: ['node_modules', 'dist', '.nuxt', '.output'],
  },

  // Vue SFCs
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: await import('vue-eslint-parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parser: await import('@typescript-eslint/parser'),
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: { vue },
    rules: {
      // Regras específicas para Vue (personalize conforme necessário)
    },
  },

  // TS/JS files
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: await import('@typescript-eslint/parser'),
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      // Regras básicas para TS/JS (ajuste conforme necessário)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
