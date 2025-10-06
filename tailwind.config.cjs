module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigoAccent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        violetAccent: {
          50: '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea',
          600: '#7e22ce',
          700: '#6b21a8',
          800: '#581c87',
          900: '#3b0764'
        }
      },
      boxShadow: {
        soft: '0 20px 60px -20px rgba(15, 23, 42, 0.45)',
        glow: '0 0 0 3px rgba(99, 102, 241, 0.35)'
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
