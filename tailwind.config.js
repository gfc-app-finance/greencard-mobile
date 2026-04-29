// Updated tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '16px',
        lg: '24px',
        md: '16px',
        sm: '8px',
        '2xl': '32px',
      },
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          soft: '#DFF4F1',
          foreground: '#FFFFFF',
        },
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui', 'sans-serif'],
        medium: ['Inter_500Medium', 'system-ui', 'sans-serif'],
        semibold: ['Inter_600SemiBold', 'system-ui', 'sans-serif'],
        bold: ['Inter_700Bold', 'system-ui', 'sans-serif'],
        black: ['Inter_900Black', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        headline: ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.04em' }], // tighter tracking for headlines
        'body-lg': ['1.125rem', { lineHeight: '1.6rem' }],
      },
    },
  },
};
