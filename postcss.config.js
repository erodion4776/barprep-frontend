// postcss.config.js
export default {
  plugins: {
    'postcss-import': {},
    tailwindcss:      {},
    autoprefixer:     {},
    cssnano: {
      preset: ['default', {
        zindex:          false,
        discardComments: { removeAll: true },
      }],
    },
  },
}
