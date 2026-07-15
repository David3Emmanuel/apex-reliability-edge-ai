/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f6f6f9',
          100: '#ececf3',
          200: '#d5d5e5',
          300: '#b1b1cd',
          400: '#8686ad',
          500: '#646491',
          600: '#4e4e75',
          700: '#3f3f5f',
          800: '#27273a',
          900: '#1b1b28',
          950: '#0f0f15',
        }
      }
    },
  },
  plugins: [],
}
