import { faKrw } from '@fortawesome/free-solid-svg-icons';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#1a3536',
        paper:     '#243e3f',
        toplayer:  '#2f6364',
        border:    '#2f5a5b',
        text:      '#f5f0e8',
        inactive:  '#596d69',
        secondary: '#b8d4d4',
        highlight: '#c8e633',
        reversed:  '#1a2a0a',
        important: '#bcad5d',

      },
      fontFamily: {
        logo:    ['Major Mono Display', 'ui-monospace', 'monospace'],
        display: ['Eczar', 'Georgia', 'serif'],
        sans:    ['Fira Sans', 'ui-sans-serif', 'system-ui'],
        extra:   ['Krona One', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
