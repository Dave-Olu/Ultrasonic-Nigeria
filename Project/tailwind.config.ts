import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        sans: ['Work Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          900: '#0E2A4D',
          700: '#1B5FA6',
          500: '#2E7DD7',
          green: '#1E8449',
          sun: '#F2A93B',
          paper: '#F3F5F5',
        },
      },
      boxShadow: {
        soft: '0 20px 48px -16px rgba(14,42,77,.35)',
      },
    },
  },
  plugins: [],
};

export default config;
