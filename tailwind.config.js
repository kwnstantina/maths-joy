/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '30%': { transform: 'rotate(1deg)' },
        },
        gradient: {
          '0% 100%': { 'background-position':"0% 100%"},
          '50%': {
            'background-position': "100% 0%"
          }
        }
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
        gradient: 'gradient 20s ease infinite',
      }
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      )
    })
  ],
}
