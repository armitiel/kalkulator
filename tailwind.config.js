/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'sm': '1.04rem',
        'base': '1.2rem',
        'lg': '1.44rem',
        'xl': '1.92rem',
        '2xl': '2.4rem',
        '3xl': '3rem',
      },
    },
  },
  plugins: [],
} 