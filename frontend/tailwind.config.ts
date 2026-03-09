import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#1D5E4E',
        'primary-dark': '#154438',
        cream:    '#F5F0E8',
        'cream-dark': '#EDE7D8',
        gold:     '#C9A84C',
        'gold-light': '#E8CC7A',
      },
      fontFamily: {
        hebrew: ['"Frank Ruhl Libre"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
