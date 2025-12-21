/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores de SomosRentable
        primary: {
          DEFAULT: '#6d45ff',
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d5cbff',
          300: '#b8a3ff',
          400: '#9670ff',
          500: '#6d45ff',
          600: '#5c24f7',
          700: '#4d14e3',
          800: '#4011bf',
          900: '#36109c',
        },
        secondary: {
          DEFAULT: '#334C71',
          50: '#f4f6f9',
          100: '#e9edf3',
          200: '#c7d1e0',
          300: '#a5b5cd',
          400: '#6280a6',
          500: '#334C71',
          600: '#2d4466',
          700: '#263955',
          800: '#1f2e45',
          900: '#1a2639',
        },
        background: {
          DEFAULT: '#ffffff',
          secondary: '#F3F4F7',
          tertiary: '#dbe4ed',
        },
        foreground: '#1a1a2e',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#6d45ff',
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fafafa',
        },
        accent: {
          DEFAULT: '#f1f5f9',
          foreground: '#1a1a2e',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
