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
          200: '#b6d4ff',
          400: '#5b8dff',
          500: '#2b6cff',
          600: '#1f54d6',
          700: '#1a44ab',
        },
        accent: {
          300: '#5ff0d6',
          400: '#2ddcbd',
          500: '#13c6a5',
          600: '#0fa88c',
        },
        ink: {
          900: '#070b18',
          850: '#0b1020',
          800: '#0f1530',
          700: '#161d3d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(43, 108, 255, 0.55)',
        'glow-accent': '0 0 40px -10px rgba(19, 198, 165, 0.5)',
        card: '0 10px 40px -20px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2b6cff 0%, #13c6a5 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rec-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.92)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'rec-pulse': 'rec-pulse 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
