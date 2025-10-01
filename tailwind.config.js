/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/theme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E49F35',
        secondary: '#967D69',
        accent: '#F4B9B2',
        wine: '#841339',
        bg: '#FEFFFE'
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};