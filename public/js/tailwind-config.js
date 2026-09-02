/**
 * Action Tailor - Tailwind CSS Configuration
 * Centralized theme colors and fonts for Tailwind CDN
 */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
          },
          surface: {
            DEFAULT: '#1e293b',
            hover: '#334155',
            dark: '#0f172a',
          },
          border: '#334155',
        },
        fontFamily: {
          sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
      },
    },
  };
}
