/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          '[#2A2A2A]': '#2A2A2A',
          primary: '#8A2BE2',
          secondary: '#00C6FF',
          accent: '#7B68EE',
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF2D55',
          'text-primary': '#FFFFFF',
          'text-secondary': '#AAAAAA',
          'text-[#777777]': '#777777',
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['SF Mono', 'Menlo', 'monospace']
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'float': 'float 3s ease-in-out infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' },
          }
        },
      },
    },
    plugins: [],
  }