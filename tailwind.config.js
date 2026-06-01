/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta GestualAI — tons sóbrios e acessíveis (alto contraste)
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#2b6cff',
          600: '#1f54d6',
          700: '#1a44ab',
        },
        accent: {
          500: '#13c6a5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
