/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Colors - Deep Navy Blue
        'brand': {
          50: '#F8F8FF',
          100: '#E8E8F2',
          200: '#C8C8DB',
          300: '#9999B8',
          400: '#5C5C8A',
          500: '#14144D',
          600: '#08083A',
          700: '#05052E',
          800: '#030324',
          900: '#01011A',
        },
        // Accent Colors - Orange-Red
        'accent': {
          50: '#FFF4F2',
          100: '#FFDDD5',
          200: '#FCB19F',
          300: '#FC8042',
          400: '#E55539',
          500: '#D94325',
          600: '#C33318',
          700: '#A32814',
          800: '#831F10',
          900: '#66180C',
        },
        // Neutral Colors - Lavender Grays
        'neutral': {
          50: '#F8F8FF',
          100: '#EDEDF5',
          200: '#D4D4DF',
          300: '#C1C1CE',
          400: '#B9B9C9',
          500: '#8A8A99',
          600: '#5C5C6B',
          700: '#3B3B4D',
          800: '#252533',
          900: '#08083A',
        },
        // Status Colors
        'status': {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#0EA5E9',
        },
      },
      fontFamily: {
        'simpler': ['SimplerPro', 'Arial', 'Helvetica', 'system-ui', 'sans-serif'],
        'sans': ['SimplerPro', 'Arial', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '27px',
        'card-sm': '16px',
        'btn': '12px',
      },
    },
  },
  plugins: [],
};
