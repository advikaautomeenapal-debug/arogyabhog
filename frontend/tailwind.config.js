/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#111111',
          dark: '#1A1A1A',
          cardDark: '#202020',
          borderDark: '#2E2A20',
          white: '#FFFFFF',
          light: '#FBFBFA',
          cardLight: '#FFFFFF',
          borderLight: '#E8E6DF',
          mutedLight: '#6B6960',
          mutedDark: '#99907C',
          gold: '#C9A227',
          goldHover: '#B58F1E',
          goldLight: '#FBF6E9',
          goldDark: '#8C6E15',
        },
        gold: {
          DEFAULT: '#C9A227',
          hover: '#B58F1E',
          light: '#FBF6E9',
          dark: '#8C6E15',
          subtle: '#FAF4E3',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        editorial: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        caps: '0.16em',
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        cardHover: '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        gold: '0 4px 20px -2px rgba(201, 162, 39, 0.25)',
      }
    },
  },
  plugins: [],
}
