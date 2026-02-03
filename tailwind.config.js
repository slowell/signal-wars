/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bronze: '#cd7f32',
        silver: '#c0c0c0',
        gold: '#ffd700',
        diamond: '#b9f2ff',
        legend: '#ff6b35',
      },
    },
  },
  plugins: [],
}
