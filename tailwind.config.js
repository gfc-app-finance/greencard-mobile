/** @type {import('tailwindcss').Config} */
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
        background: '#0A0A0A',
        foreground: '#FFFFFF',

        card: {
          DEFAULT: '#171717',
          foreground: '#FFFFFF',
        },

        primary: {
          DEFAULT: '#0F766E',
          soft: '#DFF4F1',
          foreground: '#FFFFFF',
        },

        secondary: {
          DEFAULT: '#083F3B',
          foreground: '#FFFFFF',
        },

        accent: {
          DEFAULT: '#22D3EE',
          foreground: '#0A0A0A',
        },

        muted: {
          DEFAULT: '#737373',
          foreground: '#A3A3A3',
        },

        border: '#262626',
        input: '#171717',
        ring: '#0F766E',
      },
      fontFamily: {
        heading: ['Inter_600SemiBold'],
        'heading-bold': ['Inter_700Bold'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
      },
      boxShadow: {
        'hard-5': '0px 2px 10px 0px rgba(15, 118, 110, 0.10)',
        'soft-2': '0px 0px 20px rgba(15, 118, 110, 0.2)',
      },
    },
  },
};
