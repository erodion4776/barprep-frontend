/** @type {import('tailwindcss').Config} */
export default {
  // ── Content paths ──────────────────────────────────────────────────────────
  // Tailwind scans these files to purge unused classes in production
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // ── Dark mode ──────────────────────────────────────────────────────────────
  // 'class' = toggle with <html class="dark">
  // 'media' = follows OS preference automatically
  darkMode: 'class',

  // ── Theme ──────────────────────────────────────────────────────────────────
  theme: {
    extend: {

      // ── Font family ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Brand colors — full scale ──────────────────────────────────────────
      // Matches Tailwind blue closely — swap for your brand color
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },

      // ── Custom border radius ───────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // ── Custom animations ──────────────────────────────────────────────────
      // Matches keyframes defined in index.css
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-up':   'slideUp 0.3s ease-out forwards',
        'bounce-sm':  'bounce 1s infinite',
        'spin-slow':  'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)'  },
          '100%': { opacity: '1', transform: 'translateY(0)'     },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)'  },
          '100%': { opacity: '1', transform: 'translateY(0)'     },
        },
      },

      // ── Custom box shadows ─────────────────────────────────────────────────
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-purple': '0 0 20px rgba(147, 51, 234, 0.3)',
        'card':        '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg':     '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
      },

      // ── Custom max widths ──────────────────────────────────────────────────
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // ── Typography (prose) overrides ───────────────────────────────────────
      // Used by @tailwindcss/typography plugin
      typography: (theme) => ({
        slate: {
          css: {
            '--tw-prose-body':         theme('colors.slate[600]'),
            '--tw-prose-headings':     theme('colors.slate[900]'),
            '--tw-prose-links':        theme('colors.blue[600]'),
            '--tw-prose-bold':         theme('colors.slate[900]'),
            '--tw-prose-code':         theme('colors.slate[800]'),
            '--tw-prose-pre-bg':       theme('colors.slate[900]'),
            '--tw-prose-th-borders':   theme('colors.slate[200]'),
            '--tw-prose-td-borders':   theme('colors.slate[100]'),
          },
        },
      }),
    },
  },

  // ── Safelist ───────────────────────────────────────────────────────────────
  // Classes built dynamically that Tailwind might purge in production
  // Pattern: matches bg-green-500, text-red-600, border-amber-200, etc.
  safelist: [
    // Score/grade colors used in MockExam + StudyModules
    {
      pattern: /^(bg|text|border)-(green|red|amber|blue|purple|orange|emerald|rose)-(50|100|200|300|400|500|600|700|800)$/,
    },
    // Focus colors used in topic performance bars
    {
      pattern: /^(bg|text)-(weak|strong|review)$/,
    },
    // Dynamic border colors in study plan day cards
    {
      pattern: /^border-l-(red|green|amber|purple|blue)-500$/,
    },
    // Blog post status badges
    {
      pattern: /^(bg|text)-(green|amber|red|blue)-(100|700)$/,
    },
    // Specific utility classes used in JS strings
    'animate-pulse',
    'animate-bounce',
    'animate-spin',
    'translate-x-0',
    'translate-x-4',
    'opacity-0',
    'opacity-100',
    'max-h-0',
    'max-h-96',
    'max-h-[500px]',
    'rotate-45',
    'rotate-180',
  ],

  // ── Plugins ────────────────────────────────────────────────────────────────
  plugins: [
    // Adds `prose` classes for rich text content
    // Used in: Chat, ModuleDetail, MockExam, Blog
    require('@tailwindcss/typography'),

    // Normalizes form elements cross-browser
    // Used in: Signup checkbox, all input fields
    require('@tailwindcss/forms')({
      strategy: 'class', // only apply when you add `form-input` class
                         // won't break existing styled inputs
    }),
  ],
}
