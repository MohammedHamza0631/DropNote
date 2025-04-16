/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#000000',
          800: '#111111',
          700: '#222222',
        },
        light: {
          DEFAULT: '#f8f7f2', // off-white with yellowish tint
          800: '#f1f0ea',
          700: '#eae9e3',
        }
      }
    },
  },
  plugins: [],
};
