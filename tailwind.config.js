/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F2EA',
        card: '#FFFFFF',
        ink: '#23201C',
        mute: '#8A8378',
        vermilion: '#B3402A',
        moss: '#5C6E4E',
        line: '#E5DFD3'
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'STSong', 'SimSun', 'serif']
      }
    }
  },
  plugins: []
}
