// postcss.config.js
const isProd = process.env.NODE_ENV === 'production'

export default {
  plugins: {
    // ── Required: process @import statements ──────────────────
    // Allows splitting CSS across multiple files
    'postcss-import': {},

    // ── Required: Tailwind CSS ────────────────────────────────
    tailwindcss: {},

    // ── Required: Add vendor prefixes automatically ───────────
    // e.g. -webkit-transform, -moz-transition etc.
    autoprefixer: {},

    // ── Production only: Minify CSS output ───────────────────
    // Reduces file size ~20-30% beyond Tailwind's purge
    // Disabled in dev to keep HMR fast
    ...(isProd ? {
      cssnano: {
        preset: ['default', {
          // Keep z-index values (Tailwind uses specific values)
          zindex:           false,
          // Keep calc() expressions readable
          calc:             false,
          // Merge duplicate selectors
          mergeLonghand:    true,
          // Remove comments
          discardComments:  { removeAll: true },
        }],
      },
    } : {}),
  },
}
