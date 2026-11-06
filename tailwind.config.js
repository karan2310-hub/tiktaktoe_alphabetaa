/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        maxNode: {
          light: '#22c55e',
          DEFAULT: '#16a34a',
          dark: '#15803d'
        },
        minNode: {
          light: '#f97316',
          DEFAULT: '#ea580c',
          dark: '#c2410c'
        },
        pruned: {
          DEFAULT: '#64748b',
          dark: '#475569'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}

