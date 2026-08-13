const isProd = process.env.NODE_ENV === 'production'

export default {
  plugins: {
    // Process @import statements
    'postcss-import': {},

    // Tailwind CSS
    tailwindcss: {},

    // Vendor prefixes
    autoprefixer: {},

    // Production CSS minification
    // Only included if cssnano is installed
    ...(isProd && (() => {
      try {
        require.resolve('cssnano')
        return {
          cssnano: {
            preset: ['default', {
              zindex:          false,
              calc:            false,
              discardComments: { removeAll: true },
            }],
          },
        }
      } catch {
        // cssnano not installed - skip silently
        return {}
      }
    })()),
  },
}
