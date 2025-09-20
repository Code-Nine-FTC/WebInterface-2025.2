module.exports = {
  content: [
    '.nuxt/**/*.{js,ts,vue}',
    'app/**/*.{vue,js,ts}',
    'components/**/*.{vue,js,ts}',
    'layouts/**/*.{vue,js,ts}',
    'pages/**/*.{vue,js,ts}',
    'stores/**/*.{js,ts}',
    'composables/**/*.{js,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: [],
  prefix: 'tw-'
}