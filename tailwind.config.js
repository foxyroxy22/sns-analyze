/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yellow: '#FFEE00',
        blue:   '#0033FF',
        black:  '#0A0A0A',
        offwhite: '#F5F5F0',
        gray:   '#1A1A1A',
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans:      ['Pretendard', 'sans-serif'],
        mono:      ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { DEFAULT: '0px', none: '0px' },
    },
  },
  plugins: [],
}
