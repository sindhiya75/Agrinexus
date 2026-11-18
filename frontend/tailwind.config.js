/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ece5',
          200: '#c4dcd0',
          300: '#9bc5b3',
          400: '#6ea991',
          500: '#468a70',
          600: '#2f6e55',
          700: '#235643',
          800: '#1b4334',
          900: '#143428',
          950: '#0a1c15',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f8f6ee',
          200: '#f1ede0',
          300: '#e5dfcb',
          400: '#d5cca9',
          500: '#bdae84',
          600: '#9e8d64',
          700: '#7a6c4c',
          800: '#564c35',
          900: '#342e20',
        },
        earth: {
          50: '#faf9f6',
          100: '#f3f1ec',
          200: '#e6e3da',
          300: '#d1cdc1',
          400: '#a8a293',
          500: '#7c7565',
          600: '#5c5649',
          700: '#454035',
          800: '#2f2c24',
          900: '#1a1813',
        },
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(20, 52, 40, 0.05), 0 1px 3px -1px rgba(20, 52, 40, 0.03)',
        'card': '0 4px 20px -2px rgba(20, 52, 40, 0.06), 0 2px 6px -1px rgba(20, 52, 40, 0.04)',
        'elevated': '0 12px 30px -4px rgba(20, 52, 40, 0.10), 0 4px 10px -2px rgba(20, 52, 40, 0.05)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
