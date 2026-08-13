/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
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
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out forwards',
        'slide-down':'slideDown 0.3s ease-out forwards',
        'slide-up':  'slideUp 0.3s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
      },
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-purple': '0 0 20px rgba(147, 51, 234, 0.3)',
        'card':        '0 1px 3px rgba(0,0,0,0.06)',
        'card-lg':     '0 4px 6px rgba(0,0,0,0.07)',
      },
    },
  },

  safelist: [
    {
      pattern: /^(bg|text|border)-(green|red|amber|blue|purple|orange|emerald|rose)-(50|100|200|300|400|500|600|700|800)$/,
    },
    {
      pattern: /^border-l-(red|green|amber|purple|blue)-500$/,
    },
    'animate-pulse',
    'animate-bounce',
    'animate-spin',
    'translate-x-0',
    'translate-x-4',
    'opacity-0',
    'opacity-100',
    'max-h-0',
    'max-h-96',
    'rotate-45',
    'rotate-180',
  ],

  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}
