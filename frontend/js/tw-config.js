// Runs right after the Tailwind CDN script. Turns on class-based dark mode.
tailwind.config = {
  darkMode: 'class',
  theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } },
};
