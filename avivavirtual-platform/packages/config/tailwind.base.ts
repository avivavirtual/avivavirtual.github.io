import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    '../../apps/web/**/*.{ts,tsx}',
    '../../apps/macos/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#5aa0ff',
          500: '#327fff',
          600: '#1f62f2',
          700: '#1b4ddf',
          800: '#1d42b5',
          900: '#1d3b8e'
        }
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem'
      }
    }
  },
  plugins: []
};

export default config;
