import { defineConfig, loadEnv } from 'vite'
import react                     from '@vitejs/plugin-react'
import path                      from 'path'

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode
  const env = loadEnv(mode, process.cwd(), '')

  // ── Validate required env vars at build/dev time ──────────────────────────
  const REQUIRED_ENV = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ]

  for (const key of REQUIRED_ENV) {
    if (!env[key]) {
      console.warn(`\n⚠️  Missing environment variable: ${key}`)
      console.warn(`   Add it to your .env.local file\n`)
    }
  }

  return {
    // ── Plugins ──────────────────────────────────────────────────────────────
    plugins: [
      react({
        // Enable React Fast Refresh (default)
        fastRefresh: true,
      }),
    ],

    // ── Path aliases ──────────────────────────────────────────────────────────
    // Allows: import X from '@/components/X'
    // Instead of: import X from '../../../components/X'
    resolve: {
      alias: {
        '@':           path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages':      path.resolve(__dirname, './src/pages'),
        '@context':    path.resolve(__dirname, './src/context'),
        '@api':        path.resolve(__dirname, './src/api'),
        '@hooks':      path.resolve(__dirname, './src/hooks'),
        '@utils':      path.resolve(__dirname, './src/utils'),
        '@assets':     path.resolve(__dirname, './src/assets'),
      },
    },

    // ── Dev server ────────────────────────────────────────────────────────────
    server: {
      port:        3000,
      strictPort:  false,   // try next port if 3000 is busy
      open:        false,   // don't auto-open browser
      cors:        true,

      // Proxy API calls in dev to avoid CORS issues
      // Uncomment and update if your backend runs locally
      // proxy: {
      //   '/api': {
      //     target:      'http://localhost:8000',
      //     changeOrigin: true,
      //     rewrite:     (path) => path.replace(/^\/api/, ''),
      //   },
      // },
    },

    // ── Preview server (vite preview) ─────────────────────────────────────────
    preview: {
      port: 4173,
      cors: true,
    },

    // ── Build configuration ───────────────────────────────────────────────────
    build: {
      // Target modern browsers (matches Tailwind's target)
      target: 'es2015',

      // Output directory
      outDir: 'dist',

      // Clean output dir before build
      emptyOutDir: true,

      // Source maps in production
      // 'hidden' = generate but don't reference in bundle
      // Useful for error tracking (Sentry etc.) without exposing source
      sourcemap: mode === 'production' ? 'hidden' : true,

      // Raise chunk size warning threshold
      // Default 500KB is too low for React + Tailwind + Supabase
      chunkSizeWarningLimit: 1000,

      // ── Rollup options (chunk splitting) ─────────────────────────────────
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          // Each chunk is cached independently
          // When you update Chat.jsx, only the chat chunk invalidates
          manualChunks: {
            // React core — rarely changes
            'vendor-react': [
              'react',
              'react-dom',
              'react-router-dom',
            ],

            // Supabase — large, rarely changes
            'vendor-supabase': [
              '@supabase/supabase-js',
            ],

            // Markdown rendering — blog + chat
            'vendor-markdown': [
              'react-markdown',
              'remark-gfm',
              'react-syntax-highlighter',
            ],

            // HTTP client
            'vendor-axios': [
              'axios',
            ],

            // Date utilities
            'vendor-dates': [
              'date-fns',
            ],
          },

          // Asset file naming with content hash for cache busting
          chunkFileNames:  'assets/js/[name]-[hash].js',
          entryFileNames:  'assets/js/[name]-[hash].js',
          assetFileNames:  'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },

    // ── CSS ───────────────────────────────────────────────────────────────────
    css: {
      devSourcemap: true,
    },

    // ── Optimizations (pre-bundling) ──────────────────────────────────────────
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'axios',
        'react-markdown',
        'remark-gfm',
        'date-fns',
      ],
      // Force re-optimization if deps change
      force: false,
    },

    // ── Define global constants ───────────────────────────────────────────────
    define: {
      // Expose app version from package.json
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || '1.0.0'
      ),
      // Expose build mode
      __DEV__: mode === 'development',
    },
  }
})
