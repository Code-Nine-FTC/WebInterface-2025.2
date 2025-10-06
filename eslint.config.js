import vue from 'eslint-plugin-vue';

export default [
  {
    files: ['**/*.vue'],
    ignores: ['node_modules', 'dist'],
    languageOptions: {
      parser: await import('vue-eslint-parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parser: {
          js: await import('@typescript-eslint/parser'),
          ts: await import('@typescript-eslint/parser'),
        },
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      vue,
    },
    rules: {
      // Suas regras para Vue aqui
    },
  },
];
