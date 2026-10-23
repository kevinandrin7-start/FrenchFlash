/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'card-in': { '0%': { opacity: 0, transform: 'translateY(24px) scale(.94)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'card-in': 'card-in .35s cubic-bezier(.2,.8,.2,1) both',
        'fade-up': 'fade-up .3s ease-out both',
        pop: 'pop .45s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
